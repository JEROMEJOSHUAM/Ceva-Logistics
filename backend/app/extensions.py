"""
Supabase service-role client for backend operations.
Uses the service key (bypasses RLS) for trusted server-side mutations.
"""
import os
from dotenv import load_dotenv

load_dotenv()

_url: str = os.getenv("SUPABASE_URL", "")
_key: str = os.getenv("SUPABASE_KEY", "")   # service role key — bypasses RLS

# Supabase JWT service keys always start with "eyJ"
_key_looks_valid = _key.startswith("eyJ") and len(_key) > 100

if not _url or not _key_looks_valid:
    print(
        "[WARN] backend/.env: SUPABASE_URL or SUPABASE_KEY not configured correctly. "
        "Backend will return 503 on Supabase-dependent endpoints. "
        "Set the service_role key from: Supabase Dashboard -> Project Settings -> API"
    )
    supabase_admin = None
else:
    from supabase import create_client, Client
    supabase_admin: Client = create_client(_url, _key)
    print(f"[OK] Supabase admin client initialized for: {_url}")
