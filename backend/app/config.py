import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    HMAC_SECRET        = os.getenv("HMAC_SECRET_KEY", "ceva_security_pass_secret_signature_key_2026")
    SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
    SUPABASE_URL       = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY       = os.getenv("SUPABASE_KEY", "")   # service role key
