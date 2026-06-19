import hashlib

def hash_aadhaar(aadhaar: str) -> str:
    return hashlib.sha256(aadhaar.strip().encode()).hexdigest()