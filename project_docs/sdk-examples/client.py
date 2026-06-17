import time
import uuid
import json
import base64
import requests
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat

# Configuration
SERVER_URL = "http://localhost:3000"
TENANT_ID = "123e4567-e89b-12d3-a456-426614174000"

class KavachDPoPSigner:
    """
    Demonstrates client-side ECDSA (ES256) DPoP proof generation in Python.
    """
    def __init__(self):
        # Generate private key for signing proofs
        self.private_key = ec.generate_private_key(ec.SECP256R1())
        self.public_key = self.private_key.public_key()
        
        # Convert public key parameters to JWK format
        numbers = self.public_key.public_numbers()
        x_bytes = numbers.x.to_bytes(32, byteorder='big')
        y_bytes = numbers.y.to_bytes(32, byteorder='big')
        
        self.jwk = {
            "kty": "EC",
            "crv": "P-256",
            "x": base64.urlsafe_b64encode(x_bytes).decode('utf-8').rstrip('='),
            "y": base64.urlsafe_b64encode(y_bytes).decode('utf-8').rstrip('=')
        }

    def _base64url_encode(self, data: bytes) -> str:
        return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

    def create_proof(self, method: str, url: str) -> str:
        """
        Build and sign a three-part DPoP JWT proof.
        """
        header = {
            "typ": "dpop+jwt",
            "alg": "ES256",
            "jwk": self.jwk
        }
        
        payload = {
            "jti": str(uuid.uuid4()),
            "htm": method.upper(),
            "htu": url,
            "iat": int(time.time())
        }
        
        header_b64 = self._base64url_encode(json.dumps(header).encode('utf-8'))
        payload_b64 = self._base64url_encode(json.dumps(payload).encode('utf-8'))
        signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        
        # Sign the input using ECDSA with SHA-256
        signature = self.private_key.sign(
            signing_input,
            ec.ECDSA(hashes.SHA256())
        )
        
        signature_b64 = self._base64url_encode(signature)
        return f"{header_b64}.{payload_b64}.{signature_b64}"

def run_client_demo():
    print("--- KavachID Python SDK Reference Client ---")
    signer = KavachDPoPSigner()
    
    # 1. Fetch JWKS Metadata
    print("\n[1] Fetching public JSON Web Key Set (JWKS)...")
    jwks_res = requests.get(f"{SERVER_URL}/oauth/jwks?alg=ES256")
    if jwks_res.status_code == 200:
        print("✔ JWKS loaded successfully:")
        print(json.dumps(jwks_res.json(), indent=2))
    else:
        print("❌ Failed to fetch JWKS")
        return

    # 2. Login using DPoP Proof
    login_url = f"{SERVER_URL}/auth/login"
    print(f"\n[2] Logging in with DPoP proof at: {login_url}")
    
    dpop_proof = signer.create_proof("POST", login_url)
    headers = {
        "Content-Type": "application/json",
        "x-tenant-id": TENANT_ID,
        "dpop": dpop_proof
    }
    
    payload = {
        "identifier": "admin@kavachid.local",
        "password": "SuperSecretPass!",
        "fingerprint": "python-script-fingerprint"
    }
    
    # Send login request
    try:
        res = requests.post(login_url, json=payload, headers=headers)
        if res.status_code == 201:
            tokens = res.json()
            print("✔ Login successful!")
            print(f"  - Access Token: {tokens['accessToken'][:30]}...")
            print(f"  - Refresh Token: {tokens['refreshToken']}")
        else:
            print(f"❌ Login failed ({res.status_code}): {res.text}")
    except Exception as e:
        print(f"❌ Connection error during login: {e}")

if __name__ == "__main__":
    run_client_demo()
