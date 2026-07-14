import os
import time
import pyotp
import hmac
import hashlib
import json
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, Header, status, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from jose import jwt, JWTError

from app.config import Config

app = FastAPI(
    title="CEVA Logistics - Visitor & Truck Management API",
    version="1.0.0",
    description="""
    Production-grade API backend for CEVA Logistics VMS & TMS systems.
    
    ### Modules Covered:
    * **Auth & RBAC**: Supabase token validation and user profiles.
    * **Company Onboarding**: Public registration, hierarchy routing, and 2FA SMS code checks.
    * **Asset Roster**: Management and internal validation of visitors, trucks, and drivers.
    * **VMS Gate Pass**: Dual-approvals workflow and secure HMAC QR signature generation.
    * **TMS Cargo**: Outbound/Inbound dispatches and seal integrity photo verification.
    """,
    contact={
        "name": "CEVA Logistics Security Engineering",
        "url": "https://www.cevalogistics.com/en",
    }
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HMAC_SECRET = Config.HMAC_SECRET
SUPABASE_JWT_SECRET = Config.SUPABASE_JWT_SECRET

# Mock database
DATABASE = {
    "companies": [],
    "profiles": [],
    "workers": [],
    "passes": [],
    "trucks": [],
    "drivers": [],
    "deliveries": [],
    "alerts": [],
    "logs": []
}

OTP_SESSIONS = {}

# ==========================================================================
# AUTHENTICATION SCHEMAS & DEPENDENCY
# ==========================================================================

class UserProfile(BaseModel):
    id: str = Field(..., description="Unique User ID", example="u_123")
    full_name: str = Field(..., description="User full display name", example="Marcus Miller")
    role: str = Field(..., description="System permissions role", example="ceva_admin")
    company_id: Optional[str] = Field(None, description="Linked vendor company ID (NULL for Ceva Admin)", example="c1")

def get_current_user(authorization: Optional[str] = Header(None, description="Bearer authorization JWT token")) -> UserProfile:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header. Must use Bearer scheme."
        )
    
    token = authorization.split(" ")[1]
    if token == "mock-ceva-admin-token":
        return UserProfile(id="u1", full_name="System Admin", role="ceva_admin")
    elif token == "mock-vendor-admin-token":
        return UserProfile(id="u2", full_name="QuickTrans Manager", role="vendor_admin", company_id="c1")
    
    try:
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="JWT does not contain sub identity claim.")
        return UserProfile(
            id=user_id,
            full_name=payload.get("name", "Verified User"),
            role=payload.get("role", "worker"),
            company_id=payload.get("company_id")
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature or expired token."
        )

# ==========================================================================
# PYDANTIC INPUT MODELS WITH SWAGGER DESCRIPTIONS
# ==========================================================================

class CompanyRegisterSchema(BaseModel):
    name: str = Field(..., description="Unique legal company name", example="Apex Cargo Ltd")
    email: EmailStr = Field(..., description="Operational contact email", example="ops@apexcargo.com")
    phone: str = Field(..., description="Contact telephone number", example="+1 555-0811")
    type: str = Field(..., description="Onboarding category ('vendor' or 'trucking')", example="vendor")
    parent_company_id: Optional[str] = Field(None, description="Linked parent vendor ID (only for subcontracted 3PLs)", example="c_123")

class VerifyCompany2FAInput(BaseModel):
    company_id: str = Field(..., description="ID of the company undergoing verification", example="c_17839")
    otp_code: str = Field(..., description="The 6-digit TOTP SMS verification code", example="123456")

class WorkerRegisterSchema(BaseModel):
    name: str = Field(..., description="Full legal name of the worker", example="Jane Doe")
    email: EmailStr = Field(..., description="Email address of the visitor", example="jane.doe@quicktrans.com")
    phone: str = Field(..., description="Mobile contact number", example="+1 555-0211")
    company_id: str = Field(..., description="Reference ID to the approved parent company", example="c1")
    supervisor_name: str = Field(..., description="Onsite contractor supervisor name", example="Marcus Aurelius")

class TruckRegisterSchema(BaseModel):
    plate: str = Field(..., description="Vehicle license plate number", example="TX-9982")
    vin: str = Field(..., description="17-character unique VIN", min_length=17, max_length=17, example="1FVAC54Y3G8921234")
    model: str = Field(..., description="Truck make and model description", example="Freightliner Cascadia")
    company_id: str = Field(..., description="ID of the trucking company", example="tc1")

class DriverRegisterSchema(BaseModel):
    name: str = Field(..., description="Full legal name of the driver", example="John Smith")
    license_number: str = Field(..., description="CDL credential number", example="CDL-8872")
    company_id: str = Field(..., description="ID of the approved trucking company", example="tc1")

class PassRequestSchema(BaseModel):
    worker_id: str = Field(..., description="ID of the worker applying for the gate pass", example="w1")
    company_id: str = Field(..., description="ID of the approved vendor company", example="c1")
    zone_level: str = Field(..., description="Zone clearance level requested", example="Zone A - Warehouse Floor")
    start_date: str = Field(..., description="First day of visit (YYYY-MM-DD)", example="2026-07-15")
    end_date: str = Field(..., description="Last day of visit (YYYY-MM-DD)", example="2026-07-20")
    start_time: str = Field(..., description="Clearance window start (HH:MM)", example="08:00")
    end_time: str = Field(..., description="Clearance window end (HH:MM)", example="17:00")
    purpose: str = Field(..., description="Detailed description of the purpose of visit", example="Routine machinery service check")

class DeliveryAssignSchema(BaseModel):
    truck_id: str = Field(..., description="Vehicle asset identifier", example="t1")
    driver_id: str = Field(..., description="Driver asset identifier", example="d1")
    company_id: str = Field(..., description="Carrier company identifier", example="tc1")
    type: str = Field(..., description="Logistics operation category ('dropoff' | 'pickup')", example="dropoff")
    seal_number: str = Field(..., description="High-security container seal ID number", example="SEAL-9981")
    baseline_seal_photo: Optional[str] = Field(None, description="Image URL of the baseline container seal", example="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d")
    items: str = Field(..., description="Summary description of cargo items", example="Automotive replacement parts")

# ==========================================================================
# ENDPOINT IMPLEMENTATIONS (WITH SWAGGER METADATA)
# ==========================================================================

@app.post("/api/v1/companies/register", 
          status_code=201, 
          tags=["Company Onboarding"],
          summary="Register a new company application",
          description="Submits an onboarding request. Hierarchy routing applies.")
def register_company(payload: CompanyRegisterSchema):
    for c in DATABASE["companies"]:
        if c["name"] == payload.name or c["email"] == payload.email:
            raise HTTPException(status_code=400, detail="Company name or email is already registered.")
            
    if payload.type == "trucking" and payload.parent_company_id:
        status_state = "pending_vendor"
    else:
        status_state = "pending_ceva"
        
    company = {
        "id": f"c_{int(time.time())}",
        "name": payload.name,
        "email": payload.email,
        "phone": payload.phone,
        "type": payload.type,
        "parent_company_id": payload.parent_company_id,
        "status": status_state,
        "created_at": str(time.time())
    }
    DATABASE["companies"].append(company)
    
    DATABASE["logs"].append({
        "id": f"l_{int(time.time())}",
        "message": f"Company registration submitted: {payload.name} (type: {payload.type}, status: {status_state})"
    })
    
    return {"message": "Onboarding request registered successfully.", "company": company}

@app.get("/api/v1/companies/pending-vendor", 
         tags=["Company Onboarding"],
         summary="List registrations pending parent vendor clearance",
         description="Lists all subcontracted 3PL requests routing through the active Vendor Admin's company.")
def get_pending_vendor_registrations(user: UserProfile = Depends(get_current_user)):
    if user.role != "vendor_admin":
        raise HTTPException(status_code=403, detail="Vendor Admin permissions required.")
        
    pending = [
        c for c in DATABASE["companies"]
        if c["status"] == "pending_vendor" and c["parent_company_id"] == user.company_id
    ]
    return pending

@app.post("/api/v1/companies/vendor-approve/{company_id}", 
          tags=["Company Onboarding"],
          summary="Vendor Admin clears a subcontracted company",
          description="Approving a sub-contractor routes it forward to Ceva Logistics review queue.")
def vendor_clear_subcontractor(company_id: str, approve: bool = Query(...), user: UserProfile = Depends(get_current_user)):
    if user.role != "vendor_admin":
        raise HTTPException(status_code=403, detail="Access denied.")
        
    for c in DATABASE["companies"]:
        if c["id"] == company_id and c["parent_company_id"] == user.company_id:
            c["status"] = "pending_ceva" if approve else "rejected"
            return {"message": f"Company status updated to: {c['status']}"}
            
    raise HTTPException(status_code=404, detail="Company registration request not found.")

@app.post("/api/v1/companies/trigger-2fa/{company_id}", 
          tags=["Company Onboarding"],
          summary="Trigger 2FA verification for Ceva approval",
          description="Generates a 6-digit TOTP SMS verification code for Ceva Admin approvals.")
def trigger_ceva_2fa(company_id: str, user: UserProfile = Depends(get_current_user)):
    if user.role != "ceva_admin":
        raise HTTPException(status_code=403, detail="Requires Ceva Admin credentials.")
        
    otp_secret = pyotp.random_base32()
    totp = pyotp.TOTP(otp_secret, interval=300)
    code = totp.now()
    
    OTP_SESSIONS[company_id] = otp_secret
    return {
        "message": "2FA TOTP code generated and dispatched.",
        "simulated_code": code
    }

@app.post("/api/v1/companies/ceva-approve", 
          tags=["Company Onboarding"],
          summary="Complete company approval with 2FA check",
          description="Verifies the TOTP code. On validation success, updates company status to 'approved'.")
def verify_company_ceva(payload: VerifyCompany2FAInput, user: UserProfile = Depends(get_current_user)):
    if user.role != "ceva_admin":
        raise HTTPException(status_code=403, detail="Access denied.")
        
    secret = OTP_SESSIONS.get(payload.company_id)
    if not secret:
        raise HTTPException(status_code=400, detail="No active 2FA session found for this company.")
        
    totp = pyotp.TOTP(secret, interval=300)
    if not totp.verify(payload.otp_code):
        raise HTTPException(status_code=401, detail="Invalid 2FA code.")
        
    for c in DATABASE["companies"]:
        if c["id"] == payload.company_id:
            c["status"] = "approved"
            del OTP_SESSIONS[payload.company_id]
            return {"message": "Company onboarding successfully verified and approved."}
            
    raise HTTPException(status_code=404, detail="Company not found.")

# ==========================================================================
# ASSET REGISTRATION ROUTERS
# ==========================================================================

@app.post("/api/v1/workers/register", 
          status_code=201, 
          tags=["Asset Roster"],
          summary="Register worker/visitor profile",
          description="Vendor Admin registers a worker. Set status = 'pending'.")
def register_worker(payload: WorkerRegisterSchema, user: UserProfile = Depends(get_current_user)):
    if user.role != "vendor_admin" or user.company_id != payload.company_id:
        raise HTTPException(status_code=403, detail="Cannot register workers for other companies.")
        
    worker = {
        "id": f"w_{int(time.time())}",
        "name": payload.name,
        "email": payload.email,
        "phone": payload.phone,
        "company_id": payload.company_id,
        "supervisor_name": payload.supervisor_name,
        "status": "pending",
        "photo_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
    }
    DATABASE["workers"].append(worker)
    return worker

@app.post("/api/v1/workers/verify/{worker_id}", 
          tags=["Asset Roster"],
          summary="Verify worker profile credentials",
          description="Updates worker profile status to 'approved' or 'rejected'.")
def verify_worker_profile(worker_id: str, approve: bool = Query(...), user: UserProfile = Depends(get_current_user)):
    if user.role != "vendor_admin":
        raise HTTPException(status_code=403, detail="Access denied.")
        
    for w in DATABASE["workers"]:
        if w["id"] == worker_id and w["company_id"] == user.company_id:
            w["status"] = "approved" if approve else "rejected"
            return {"message": f"Worker profile status: {w['status']}"}
            
    raise HTTPException(status_code=404, detail="Worker profile not found.")

@app.post("/api/v1/trucks/register", 
          status_code=201, 
          tags=["Asset Roster"],
          summary="Register truck asset",
          description="Trucking Company Admin registers a truck. Set status = 'pending'.")
def register_truck(payload: TruckRegisterSchema, user: UserProfile = Depends(get_current_user)):
    if user.role != "trucking_admin" and user.role != "vendor_admin":
        raise HTTPException(status_code=403, detail="Requires trucking or vendor admin credentials.")
        
    truck = {
        "id": f"t_{int(time.time())}",
        "plate": payload.plate,
        "vin": payload.vin,
        "model": payload.model,
        "company_id": payload.company_id,
        "status": "pending"
    }
    DATABASE["trucks"].append(truck)
    return truck

@app.post("/api/v1/trucks/verify/{truck_id}", 
          tags=["Asset Roster"],
          summary="Verify truck asset status",
          description="Approves or rejects a truck asset profile.")
def verify_truck_asset(truck_id: str, approve: bool = Query(...), user: UserProfile = Depends(get_current_user)):
    if user.role != "trucking_admin" and user.role != "vendor_admin":
        raise HTTPException(status_code=403, detail="Requires admin credentials.")
        
    for t in DATABASE["trucks"]:
        if t["id"] == truck_id and t["company_id"] == user.company_id:
            t["status"] = "approved" if approve else "rejected"
            return {"message": f"Truck asset status: {t['status']}"}
            
    raise HTTPException(status_code=404, detail="Truck profile not found.")

@app.post("/api/v1/drivers/register", 
          status_code=201, 
          tags=["Asset Roster"],
          summary="Register driver asset",
          description="Trucking Company Admin registers a driver. Set status = 'pending'.")
def register_driver(payload: DriverRegisterSchema, user: UserProfile = Depends(get_current_user)):
    if user.role != "trucking_admin" and user.role != "vendor_admin":
        raise HTTPException(status_code=403, detail="Requires admin credentials.")
        
    driver = {
        "id": f"d_{int(time.time())}",
        "name": payload.name,
        "license_number": payload.license_number,
        "company_id": payload.company_id,
        "status": "pending",
        "photo_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
    }
    DATABASE["drivers"].append(driver)
    return driver

@app.post("/api/v1/drivers/verify/{driver_id}", 
          tags=["Asset Roster"],
          summary="Verify driver credentials status",
          description="Approves or rejects a driver profile.")
def verify_driver_asset(driver_id: str, approve: bool = Query(...), user: UserProfile = Depends(get_current_user)):
    if user.role != "trucking_admin" and user.role != "vendor_admin":
        raise HTTPException(status_code=403, detail="Requires admin credentials.")
        
    for d in DATABASE["drivers"]:
        if d["id"] == driver_id and d["company_id"] == user.company_id:
            d["status"] = "approved" if approve else "rejected"
            return {"message": f"Driver profile status: {d['status']}"}
            
    raise HTTPException(status_code=404, detail="Driver credentials profile not found.")

# ==========================================================================
# VMS GATE PASS ROUTERS
# ==========================================================================

@app.post("/api/v1/passes/request", 
          status_code=201, 
          tags=["VMS Gate Pass"],
          summary="Request a gate visitor pass",
          description="Submits request. Pre-requisite: worker status must be 'approved'.")
def request_gate_pass(payload: PassRequestSchema):
    worker = next((w for w in DATABASE["workers"] if w["id"] == payload.worker_id), None)
    if not worker or worker["status"] != "approved":
        raise HTTPException(status_code=400, detail="Worker profile must be verified/approved first.")
        
    new_pass = {
        "id": f"p_{int(time.time())}",
        "worker_id": payload.worker_id,
        "company_id": payload.company_id,
        "zone_level": payload.zone_level,
        "start_date": payload.start_date,
        "end_date": payload.end_date,
        "start_time": payload.start_time,
        "end_time": payload.end_time,
        "purpose": payload.purpose,
        "status": "pending_vendor",
        "checked_in": False,
        "checked_out": False
    }
    DATABASE["passes"].append(new_pass)
    return new_pass

@app.post("/api/v1/passes/verify-vendor/{pass_id}", 
          tags=["VMS Gate Pass"],
          summary="Vendor Admin clearance check",
          description="Vendor Admin clears pass request (Step-1 approval).")
def verify_pass_vendor(pass_id: str, approve: bool = Query(...), user: UserProfile = Depends(get_current_user)):
    if user.role != "vendor_admin":
        raise HTTPException(status_code=403, detail="Access denied.")
        
    for p in DATABASE["passes"]:
        if p["id"] == pass_id and p["company_id"] == user.company_id:
            p["status"] = "pending_ceva" if approve else "rejected"
            return {"message": f"Vendor verification recorded. Status: {p['status']}"}
    raise HTTPException(status_code=404, detail="Pass request not found.")

@app.post("/api/v1/passes/verify-ceva/{pass_id}", 
          tags=["VMS Gate Pass"],
          summary="Ceva Admin final authorization & QR sign",
          description="Ceva Admin authorizes pass and generates secure HMAC signature.")
def verify_pass_ceva(pass_id: str, approve: bool = Query(...), user: UserProfile = Depends(get_current_user)):
    if user.role != "ceva_admin":
        raise HTTPException(status_code=403, detail="Access denied.")
        
    for p in DATABASE["passes"]:
        if p["id"] == pass_id and p["status"] == "pending_ceva":
            if approve:
                p["status"] = "approved"
                payload_str = f"{p['id']}:{p['worker_id']}:{p['zone_level']}:{p['end_date']}"
                signature = hmac.new(
                    HMAC_SECRET.encode(),
                    payload_str.encode(),
                    hashlib.sha256
                ).hexdigest()
                p["qr_secure_signature"] = signature
                return {"message": "Pass approved.", "qr_signature": signature}
            else:
                p["status"] = "rejected"
                return {"message": "Pass rejected."}
                
    raise HTTPException(status_code=404, detail="Pass request not found or pending vendor clearance.")

# ==========================================================================
# TMS CARGO LOGISTICS ROUTERS
# ==========================================================================

@app.post("/api/v1/deliveries/assign", 
          status_code=201, 
          tags=["TMS Logistics Cargo"],
          summary="Assign a cargo delivery dispatch task",
          description="Trucking Admin dispatches task.")
def assign_cargo_delivery(payload: DeliveryAssignSchema, user: UserProfile = Depends(get_current_user)):
    if user.role != "trucking_admin" and user.role != "vendor_admin":
        raise HTTPException(status_code=403, detail="Requires trucking coordinator role.")
        
    delivery = {
        "id": f"del_{int(time.time())}",
        "truck_id": payload.truck_id,
        "driver_id": payload.driver_id,
        "company_id": payload.company_id,
        "type": payload.type,
        "seal_number": payload.seal_number,
        "baseline_seal_photo_url": payload.baseline_seal_photo or "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&h=200&fit=crop",
        "items": payload.items,
        "status": "assigned",
        "checked_in": False,
        "checked_out": False
    }
    DATABASE["deliveries"].append(delivery)
    return delivery
