const getCrypto = (): Crypto => {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto as Crypto;
  }
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  throw new Error('Web Crypto API is not supported in this environment');
};

function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function stringToBase64Url(str: string): string {
  return bufferToBase64Url(new TextEncoder().encode(str));
}

function generateJti(crypto: Crypto): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  let hex = '';
  for (let i = 0; i < 16; i++) {
    hex += array[i].toString(16).padStart(2, '0');
  }
  return hex;
}

export class DPoPKeyManager {
  private keyPair: CryptoKeyPair | null = null;
  private cachedThumbprint: string | null = null;
  private cachedJwk: any = null;

  async ensureKey(): Promise<void> {
    if (this.keyPair) return;

    const crypto = getCrypto();
    this.keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true, // extractable
      ['sign', 'verify']
    );

    // Export public key as JWK
    this.cachedJwk = await crypto.subtle.exportKey('jwk', this.keyPair.publicKey);
    
    // Calculate JWK Thumbprint (jkt)
    // RFC 7638 specifies thumbprint sorted keys: crv, kty, x, y
    const jwkThumbprintJson = JSON.stringify({
      crv: this.cachedJwk.crv,
      kty: this.cachedJwk.kty,
      x: this.cachedJwk.x,
      y: this.cachedJwk.y,
    });
    
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(jwkThumbprintJson));
    this.cachedThumbprint = bufferToBase64Url(hash);
  }

  async getThumbprint(): Promise<string> {
    await this.ensureKey();
    return this.cachedThumbprint!;
  }

  async getJwk(): Promise<any> {
    await this.ensureKey();
    return this.cachedJwk;
  }

  /**
   * Sign DPoP proof JWT for a specific HTTP method and URL
   */
  async createProof(method: string, url: string): Promise<string> {
    await this.ensureKey();
    const crypto = getCrypto();

    const header = {
      typ: 'dpop+jwt',
      alg: 'ES256',
      jwk: this.cachedJwk,
    };

    const payload = {
      jti: generateJti(crypto),
      htm: method.toUpperCase(),
      htu: url,
      iat: Math.floor(Date.now() / 1000),
    };

    const headerB64 = stringToBase64Url(JSON.stringify(header));
    const payloadB64 = stringToBase64Url(JSON.stringify(payload));
    const tokenInput = `${headerB64}.${payloadB64}`;

    const signature = await crypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' },
      },
      this.keyPair!.privateKey,
      new TextEncoder().encode(tokenInput)
    );

    const signatureB64 = bufferToBase64Url(signature);
    return `${tokenInput}.${signatureB64}`;
  }
}
