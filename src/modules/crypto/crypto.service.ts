import { Injectable } from '@nestjs/common';
import { Worker } from 'worker_threads';
import { generateKeyPairSync, createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import * as jose from 'jose';

@Injectable()
export class CryptoService {
  /**
   * Run Argon2id password hashing and verification in a separate Worker Thread
   * to prevent blocking NestJS's main event loop.
   */
  private runArgonWorker(
    action: 'hash' | 'verify',
    payload: { plain: string; hash?: string }
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      // Inline worker code is 100% self-contained and bundler-friendly
      const workerCode = `
        const { parentPort } = require('worker_threads');
        const argon2 = require('argon2');
        
        parentPort.on('message', async (data) => {
          try {
            if (data.action === 'hash') {
              const hash = await argon2.hash(data.plain, {
                type: argon2.argon2id,
                memoryCost: 65536,
                timeCost: 3,
                parallelism: 4
              });
              parentPort.postMessage({ success: true, result: hash });
            } else if (data.action === 'verify') {
              const match = await argon2.verify(data.hash, data.plain);
              parentPort.postMessage({ success: true, result: match });
            }
          } catch (err) {
            parentPort.postMessage({ success: false, error: err.message });
          }
        });
      `;

      const worker = new Worker(workerCode, { eval: true });

      worker.on('message', (message) => {
        worker.terminate();
        if (message.success) {
          resolve(message.result);
        } else {
          reject(new Error(message.error));
        }
      });

      worker.on('error', (err) => {
        worker.terminate();
        reject(err);
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });

      worker.postMessage({ action, ...payload });
    });
  }

  async hashPassword(password: string): Promise<string> {
    return this.runArgonWorker('hash', { plain: password });
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return this.runArgonWorker('verify', { plain: password, hash });
  }

  /**
   * Generate an asymmetric RSA or ECDSA key pair for token signing.
   */
  generateKeyPair(algorithm: 'RS256' | 'ES256' = 'RS256'): {
    publicKeyPem: string;
    privateKeyPem: string;
  } {
    if (algorithm === 'ES256') {
      const { publicKey, privateKey } = generateKeyPairSync('ec', {
        namedCurve: 'P-256',
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });
      return { publicKeyPem: publicKey, privateKeyPem: privateKey };
    }

    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    return { publicKeyPem: publicKey, privateKeyPem: privateKey };
  }

  /**
   * Sign a JWT token using a private PEM key.
   */
  async signJwt(
    payload: any,
    privateKeyPem: string,
    options: { kid: string; expiresIn: string; issuer: string; algorithm?: string }
  ): Promise<string> {
    const alg = options.algorithm || 'RS256';
    const privateKey = await jose.importPKCS8(privateKeyPem, alg);
    return await new jose.SignJWT(payload)
      .setProtectedHeader({ alg, kid: options.kid, typ: payload.typ || 'at+jwt' })
      .setIssuedAt()
      .setIssuer(options.issuer)
      .setExpirationTime(options.expiresIn)
      .sign(privateKey);
  }

  /**
   * Verify a JWT token using a public PEM key.
   */
  async verifyJwt(
    token: string,
    publicKeyPem: string,
    options?: { issuer?: string; algorithms?: string[] }
  ): Promise<jose.JWTVerifyResult> {
    const algs = options?.algorithms || ['RS256', 'ES256'];
    const header = jose.decodeProtectedHeader(token);
    const alg = header.alg;
    if (!alg || !algs.includes(alg)) {
      throw new Error(`Unsupported algorithm ${alg}`);
    }

    const publicKey = await jose.importSPKI(publicKeyPem, alg);
    return await jose.jwtVerify(token, publicKey, {
      issuer: options?.issuer
    });
  }

  /**
   * Convert a public PEM key to a standard JSON Web Key (JWK) configuration format.
   */
  async pemToJwk(publicKeyPem: string, kid: string, algorithm: string = 'RS256'): Promise<jose.JWK & { kid: string; alg: string; use: string }> {
    const publicKey = await jose.importSPKI(publicKeyPem, algorithm);
    const jwk = await jose.exportJWK(publicKey);
    return {
      kid,
      alg: algorithm,
      use: 'sig',
      ...jwk
    };
  }

  /**
   * Validate a DPoP signature and bind it to a public key thumbprint.
   */
  async verifyDpop(
    dpopHeader: string,
    expectedMethod: string,
    expectedUrl: string
  ): Promise<{ jkt: string; publicKeyJwk: jose.JWK }> {
    const header = jose.decodeProtectedHeader(dpopHeader);
    
    if (header.typ !== 'dpop+jwt' || !header.jwk) {
      throw new Error('Invalid DPoP header type or missing client jwk');
    }

    const alg = header.alg as string;
    const publicKey = await jose.importJWK(header.jwk, alg);
    const { payload } = await jose.jwtVerify(dpopHeader, publicKey);

    // Verify htm (HTTP Method) and htu (HTTP URL)
    if (payload.htm !== expectedMethod) {
      throw new Error('DPoP payload htm does not match request method');
    }

    // Standardize URL check (remove query parameters/anchors)
    const cleanUrl = expectedUrl.split('?')[0].split('#')[0];
    const dpopUrl = (payload.htu as string).split('?')[0].split('#')[0];
    if (cleanUrl !== dpopUrl) {
      throw new Error('DPoP payload htu does not match request URL');
    }

    // Clock skew check (allow 2 minutes)
    const now = Math.floor(Date.now() / 1000);
    const iat = payload.iat || 0;
    if (Math.abs(now - iat) > 120) {
      throw new Error('DPoP token expired or from future');
    }

    // Calculate thumbprint (SHA-256) of the client public key to bind to the access token
    const jkt = await jose.calculateJwkThumbprint(header.jwk);
    return { jkt, publicKeyJwk: header.jwk };
  }

  /**
   * Encrypt a private key PEM using AES-256-GCM.
   */
  encryptPrivateKey(privateKeyPem: string): string {
    const masterKey = process.env.KAVACHID_MASTER_KEY || 'default-kavachid-master-key-must-change-32bytes';
    // Hash key to ensure it is exactly 32 bytes
    const key = createHash('sha256').update(masterKey).digest();
    const iv = randomBytes(12);
    
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(privateKeyPem, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${encrypted}:${authTag}`;
  }

  /**
   * Decrypt a private key PEM using AES-256-GCM.
   */
  decryptPrivateKey(encrypted: string): string {
    const masterKey = process.env.KAVACHID_MASTER_KEY || 'default-kavachid-master-key-must-change-32bytes';
    const key = createHash('sha256').update(masterKey).digest();
    
    const parts = encrypted.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted private key format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const ciphertext = Buffer.from(parts[1], 'hex');
    const authTag = Buffer.from(parts[2], 'hex');
    
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
