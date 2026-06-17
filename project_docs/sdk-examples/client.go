package main

import (
	"bytes"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"encoding/asn1"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"time"
)

const (
	serverURL = "http://localhost:3000"
	tenantID  = "123e4567-e89b-12d3-a456-426614174000"
)

// DPoPProofHeader represents JWT Header for DPoP
type DPoPProofHeader struct {
	Typ string    `json:"typ"`
	Alg string    `json:"alg"`
	Jwk JWKPublic `json:"jwk"`
}

// JWKPublic represents public key coordinates for ES256 JWK
type JWKPublic struct {
	Kty string `json:"kty"`
	Crv string `json:"crv"`
	X   string `json:"x"`
	Y   string `json:"y"`
}

// DPoPProofPayload represents payload for DPoP token
type DPoPProofPayload struct {
	Jti string `json:"jti"`
	Htm string `json:"htm"`
	Htu string `json:"htu"`
	Iat int64  `json:"iat"`
}

func base64URLEncode(b []byte) string {
	return base64.RawURLEncoding.EncodeToString(b)
}

func generateDPoPProof(privateKey *ecdsa.PrivateKey, method string, url string) (string, error) {
	pub := privateKey.PublicKey
	xBytes := pub.X.Bytes()
	yBytes := pub.Y.Bytes()

	jwk := JWKPublic{
		Kty: "EC",
		Crv: "P-256",
		X:   base64URLEncode(xBytes),
		Y:   base64URLEncode(yBytes),
	}

	header := DPoPProofHeader{
		Typ: "dpop+jwt",
		Alg: "ES256",
		Jwk: jwk,
	}

	payload := DPoPProofPayload{
		Jti: "rand-nonce-uuid-12345",
		Htm: method,
		Htu: url,
		Iat: time.Now().Unix(),
	}

	headerJSON, _ := json.Marshal(header)
	payloadJSON, _ := json.Marshal(payload)

	headerB64 := base64URLEncode(headerJSON)
	payloadB64 := base64URLEncode(payloadJSON)

	signingInput := fmt.Sprintf("%s.%s", headerB64, payloadB64)
	hash := sha256.Sum256([]byte(signingInput))

	r, s, err := ecdsa.Sign(rand.Reader, privateKey, hash[:])
	if err != nil {
		return "", err
	}

	// Format signature components as concatenated r and s coordinates (raw 64-byte signature)
	// each coordinate padded to 32 bytes (ES256 signature format)
	rBytes := r.Bytes()
	sBytes := s.Bytes()
	signatureBytes := make([]byte, 64)
	copy(signatureBytes[32-len(rBytes):32], rBytes)
	copy(signatureBytes[64-len(sBytes):64], sBytes)

	signatureB64 := base64URLEncode(signatureBytes)
	return fmt.Sprintf("%s.%s.%s", headerB64, payloadB64, signatureB64), nil
}

func main() {
	fmt.Println("--- KavachID Go SDK Reference Client ---")

	// Generate ES256 client key pair for DPoP signatures
	privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		fmt.Printf("❌ Failed to generate keypair: %v\n", err)
		return
	}

	// 1. Fetch JWKS public keys
	fmt.Println("\n[1] Fetching OIDC public JWKS keys...")
	resp, err := http.Get(serverURL + "/oauth/jwks")
	if err != nil {
		fmt.Printf("❌ Failed to contact server: %v\n", err)
		return
	}
	defer resp.Body.Close()

	jwksBytes, _ := io.ReadAll(resp.Body)
	fmt.Printf("✔ JWKS endpoint response: %s\n", string(jwksBytes))

	// 2. Perform Login with DPoP Header
	loginURL := serverURL + "/auth/login"
	fmt.Printf("\n[2] Logging in with DPoP header proof at: %s\n", loginURL)

	dpopProof, err := generateDPoPProof(privateKey, "POST", loginURL)
	if err != nil {
		fmt.Printf("❌ Failed to create DPoP proof: %v\n", err)
		return
	}

	payload := map[string]string{
		"identifier":  "admin@kavachid.local",
		"password":    "SuperSecretPass!",
		"fingerprint": "go-client-fingerprint",
	}
	jsonPayload, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", loginURL, bytes.NewBuffer(jsonPayload))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-tenant-id", tenantID)
	req.Header.Set("dpop", dpopProof)

	client := &http.Client{}
	loginResp, err := client.Do(req)
	if err != nil {
		fmt.Printf("❌ Login connection error: %v\n", err)
		return
	}
	defer loginResp.Body.Close()

	body, _ := io.ReadAll(loginResp.Body)
	if loginResp.StatusCode == 201 {
		fmt.Printf("✔ Login successful! Response payload:\n%s\n", string(body))
	} else {
		fmt.Printf("❌ Login failed with status %d: %s\n", loginResp.StatusCode, string(body))
	}
}

// Helper types for signature parsing if standard DER format signature is generated
type ecdsaSignature struct {
	R, S *big.Int
}
func parseDERSignature(der []byte) ([]byte, error) {
	var sig ecdsaSignature
	_, err := asn1.Unmarshal(der, &sig)
	if err != nil {
		return nil, err
	}
	rBytes := sig.R.Bytes()
	sBytes := sig.S.Bytes()
	sigBytes := make([]byte, 64)
	copy(sigBytes[32-len(rBytes):32], rBytes)
	copy(sigBytes[64-len(sBytes):64], sBytes)
	return sigBytes, nil
}
