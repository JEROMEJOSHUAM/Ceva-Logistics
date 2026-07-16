import os
import hmac
import hashlib
import pyotp
import time
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, Header, status, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from jose import jwt, JWTError
from dotenv import load_dotenv

load_dotenv()

from app.config import Config
from app.extensions import supabase_admin

# ==========================================================================
# APP SETUP
# ==========================================================================

app = FastAPI(
    title="CEVA Logistics - Visitor & Truck Management API",
    version="2.0.0",
    description="""
    Production-grade API backend for CEVA Logistics VMS & TMS systems.

    ### Modules Covered:
    * **Auth & RBAC**: Supabase JWT validation with profile lookup.
    * **Company Onboarding**: Registration, hierarchy routing, 2FA TOTP approval.
    * **VMS Gate Pass**: Dual-approval workflow + HMAC-SHA256 QR signature.
    * **TMS Cargo**: Dispatch assignment and seal integrity logging.
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

HMAC_SECRET       = Config.HMAC_SECRET
SUPABASE_JWT_SECRET = Config.SUPABASE_JWT_SECRET

# In-memory 2FA session store (keyed by company_id)
OTP_SESSIONS: dict[str, str] = {}

# ==========================================================================
# AUTH DEPENDENCY  — validates Supabase JWT and fetches profile from DB
# ==========================================================================

class UserProfile(BaseModel):
    id: str
    full_name: str
    role: str
    company_id: Optional[str] = None

def get_current_user(
    authorization: Optional[str] = Header(None, description="Bearer JWT from Supabase auth")
) -> UserProfile:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header."
        )

    token = authorization.split(" ", 1)[1]

    # Decode the JWT to get the user's sub (UUID)
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},   # Supabase JWTs don't always have aud
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="JWT missing sub claim.")
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}"
        )

    # Fetch the profile row from Supabase (service role bypasses RLS)
    if supabase_admin is None:
        raise HTTPException(
            status_code=503,
            detail="Backend Supabase client not configured. Set SUPABASE_URL and SUPABASE_KEY in backend/.env"
        )

    result = supabase_admin.table("profiles").select("*").eq("id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User profile not found in database.")

    profile = result.data
    return UserProfile(
        id=profile["id"],
        full_name=profile.get("full_name", ""),
        role=profile["role"],
        company_id=profile.get("company_id"),
    )

# ==========================================================================
# PYDANTIC SCHEMAS
# ==========================================================================

class CompanyRegisterSchema(BaseModel):
    name: str = Field(..., example="Apex Cargo Ltd")
    email: EmailStr = Field(..., example="ops@apexcargo.com")
    phone: str = Field(..., example="+1 555-0811")
    type: str = Field(..., description="'vendor' or 'trucking'", example="vendor")
    parent_company_id: Optional[str] = Field(None, example="uuid-here")

class VerifyCompany2FAInput(BaseModel):
    company_id: str = Field(..., example="uuid-here")
    otp_code: str = Field(..., description="6-digit TOTP code", example="123456")

class WorkerRegisterSchema(BaseModel):
    name: str = Field(..., example="Jane Doe")
    email: EmailStr = Field(..., example="jane@quicktrans.com")
    phone: str = Field(..., example="+1 555-0211")
    company_id: str = Field(..., example="uuid-here")
    supervisor_name: str = Field(..., example="Marcus Aurelius")

class TruckRegisterSchema(BaseModel):
    plate: str = Field(..., example="TX-9982")
    vin: str = Field(..., min_length=17, max_length=17, example="1FVAC54Y3G8921234")
    model: str = Field(..., example="Freightliner Cascadia")
    company_id: str = Field(..., example="uuid-here")

class DriverRegisterSchema(BaseModel):
    name: str = Field(..., example="John Smith")
    license_number: str = Field(..., example="CDL-8872")
    company_id: str = Field(..., example="uuid-here")

class DeliveryAssignSchema(BaseModel):
    truck_id: str = Field(..., example="uuid-here")
    driver_id: str = Field(..., example="uuid-here")
    company_id: str = Field(..., example="uuid-here")
    type: str = Field(..., description="'dropoff' or 'pickup'", example="dropoff")
    seal_number: str = Field(..., example="SEAL-9981")
    baseline_seal_photo: Optional[str] = Field(None)
    items: str = Field(..., example="Automotive parts")

# ==========================================================================
# HEALTH CHECK
# ==========================================================================

@app.get("/api/v1/health", tags=["System"])
def health_check():
    """Returns service status and Supabase connectivity."""
    sb_ok = supabase_admin is not None
    return {
        "status": "ok",
        "supabase_configured": sb_ok,
        "hmac_secret_set": bool(HMAC_SECRET),
        "jwt_secret_set": bool(SUPABASE_JWT_SECRET),
    }

# ==========================================================================
# COMPANY ONBOARDING
# ==========================================================================

@app.post(
    "/api/v1/companies/register",
    status_code=201,
    tags=["Company Onboarding"],
    summary="Register a new company (public — no auth required)",
)
def register_company(payload: CompanyRegisterSchema):
    """
    Public endpoint. Inserts the company into Supabase `companies` table.
    Status is determined by type + parent hierarchy:
    - trucking + parent → 'pending_vendor'
    - trucking (no parent) → 'pending_ceva'
    - vendor → 'pending'
    """
    if supabase_admin is None:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    if payload.type == "trucking" and payload.parent_company_id:
        initial_status = "pending_vendor"
    elif payload.type == "trucking":
        initial_status = "pending_ceva"
    else:
        initial_status = "pending"

    row = {
        "name": payload.name,
        "email": payload.email,
        "phone": payload.phone,
        "type": payload.type,
        "parent_company_id": payload.parent_company_id or None,
        "status": initial_status,
    }

    result = supabase_admin.table("companies").insert(row).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Company registration failed. Email may already be registered.")

    return {
        "message": "Onboarding request submitted successfully.",
        "company": result.data[0],
    }


@app.post(
    "/api/v1/companies/trigger-2fa/{company_id}",
    tags=["Company Onboarding"],
    summary="Trigger 2FA TOTP for Ceva Admin approval",
)
def trigger_ceva_2fa(company_id: str, user: UserProfile = Depends(get_current_user)):
    """Generates a 300-second TOTP for Ceva Admin to confirm company approval."""
    if user.role != "ceva_admin":
        raise HTTPException(status_code=403, detail="Requires ceva_admin role.")

    otp_secret = pyotp.random_base32()
    totp = pyotp.TOTP(otp_secret, interval=300)
    code = totp.now()
    OTP_SESSIONS[company_id] = otp_secret

    return {"message": "2FA code generated.", "simulated_code": code}


@app.post(
    "/api/v1/companies/ceva-approve",
    tags=["Company Onboarding"],
    summary="Complete Ceva approval with 2FA TOTP verification",
)
def verify_company_ceva(payload: VerifyCompany2FAInput, user: UserProfile = Depends(get_current_user)):
    """Verifies the TOTP code and updates company status to 'approved' in Supabase."""
    if user.role != "ceva_admin":
        raise HTTPException(status_code=403, detail="Requires ceva_admin role.")

    if supabase_admin is None:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    secret = OTP_SESSIONS.get(payload.company_id)
    if not secret:
        raise HTTPException(status_code=400, detail="No active 2FA session for this company.")

    totp = pyotp.TOTP(secret, interval=300)
    if not totp.verify(payload.otp_code):
        raise HTTPException(status_code=401, detail="Invalid 2FA code.")

    supabase_admin.table("companies").update({"status": "approved"}).eq("id", payload.company_id).execute()
    del OTP_SESSIONS[payload.company_id]

    return {"message": "Company approved successfully."}


@app.post(
    "/api/v1/companies/verify/{company_id}",
    tags=["Company Onboarding"],
    summary="Approve or reject a company (Ceva or Vendor Admin)",
)
def verify_company(
    company_id: str,
    approve: bool = Query(..., description="true = approve, false = reject"),
    user: UserProfile = Depends(get_current_user),
):
    """
    Updates company status. Used for both vendor-level and ceva-level approvals:
    - pending_vendor → approved/rejected by company_admin
    - pending_ceva   → approved/rejected by ceva_admin
    """
    if supabase_admin is None:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    if user.role not in ("ceva_admin", "company_admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions.")

    result = supabase_admin.table("companies").select("status").eq("id", company_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Company not found.")

    current_status = result.data["status"]
    if approve:
        new_status = "pending_ceva" if current_status == "pending_vendor" else "approved"
    else:
        new_status = "rejected"

    supabase_admin.table("companies").update({"status": new_status}).eq("id", company_id).execute()
    return {"message": f"Company status updated to '{new_status}'."}

# ==========================================================================
# VMS GATE PASS — HMAC SIGNING ENDPOINT
# ==========================================================================

@app.post(
    "/api/v1/passes/{pass_id}/approve",
    tags=["VMS Gate Pass"],
    summary="Ceva Admin final gate pass approval + HMAC signature generation",
)
def approve_pass_ceva(
    pass_id: str,
    user: UserProfile = Depends(get_current_user),
):
    """
    Called by the frontend when a Ceva Admin approves a gate pass.
    1. Fetches pass data from Supabase.
    2. Generates HMAC-SHA256 signature: HMAC(pass_id:worker_id:zone_level:end_date).
    3. Updates `gate_passes` with status='approved' and hmac_signature.
    Returns the generated signature for display in the issued pass registry.
    """
    if user.role != "ceva_admin":
        raise HTTPException(status_code=403, detail="Requires ceva_admin role.")

    if supabase_admin is None:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    # Fetch the pass record
    result = supabase_admin.table("gate_passes").select(
        "id, worker_id, zone_level, end_date, status"
    ).eq("id", pass_id).single().execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Gate pass not found.")

    p = result.data
    if p["status"] not in ("pending_ceva", "pending_vendor"):
        raise HTTPException(
            status_code=400,
            detail=f"Pass is not in an approvable state (current: {p['status']})."
        )

    # Generate HMAC-SHA256 signature
    payload_str = f"{p['id']}:{p['worker_id']}:{p['zone_level']}:{p['end_date']}"
    signature = hmac.new(
        HMAC_SECRET.encode("utf-8"),
        payload_str.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    # Persist approval + signature to Supabase
    supabase_admin.table("gate_passes").update({
        "status": "approved",
        "hmac_signature": signature,
    }).eq("id", pass_id).execute()

    return {
        "message": "Gate pass approved and HMAC signature generated.",
        "pass_id": pass_id,
        "hmac_signature": signature,
    }


@app.post(
    "/api/v1/passes/{pass_id}/reject",
    tags=["VMS Gate Pass"],
    summary="Reject a gate pass (Ceva Admin)",
)
def reject_pass_ceva(pass_id: str, user: UserProfile = Depends(get_current_user)):
    if user.role != "ceva_admin":
        raise HTTPException(status_code=403, detail="Requires ceva_admin role.")
    if supabase_admin is None:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    supabase_admin.table("gate_passes").update({"status": "rejected"}).eq("id", pass_id).execute()
    return {"message": "Gate pass rejected."}


# ==========================================================================
# TMS CARGO DISPATCH
# ==========================================================================

@app.post(
    "/api/v1/deliveries/assign",
    status_code=201,
    tags=["TMS Cargo"],
    summary="Assign a cargo delivery dispatch task",
)
def assign_delivery(payload: DeliveryAssignSchema, user: UserProfile = Depends(get_current_user)):
    if user.role not in ("cargo_admin", "ceva_admin"):
        raise HTTPException(status_code=403, detail="Requires cargo_admin or ceva_admin role.")
    if supabase_admin is None:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    row = {
        "truck_id":             payload.truck_id,
        "driver_id":            payload.driver_id,
        "company_id":           payload.company_id,
        "type":                 payload.type,
        "seal_number":          payload.seal_number,
        "baseline_seal_photo":  payload.baseline_seal_photo,
        "items":                payload.items,
        "status":               "assigned",
        "checked_in":           False,
        "checked_out":          False,
    }
    result = supabase_admin.table("deliveries").insert(row).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Delivery assignment failed.")

    return {"message": "Delivery dispatched.", "delivery": result.data[0]}
