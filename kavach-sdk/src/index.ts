import { StorageProvider, LocalStorageProvider, MemoryStorageProvider } from './storage.js';
import { DPoPKeyManager } from './dpop.js';

export interface KavachClientOptions {
  serverUrl: string;
  tenantId: string;
  storage?: StorageProvider;
}

export class KavachClient {
  private readonly serverUrl: string;
  private readonly tenantId: string;
  private readonly storage: StorageProvider;
  private readonly dpop: DPoPKeyManager;

  constructor(options: KavachClientOptions) {
    this.serverUrl = options.serverUrl.endsWith('/')
      ? options.serverUrl.slice(0, -1)
      : options.serverUrl;
    this.tenantId = options.tenantId;
    
    // Choose default storage (localStorage in browsers, Memory fallback elsewhere)
    this.storage = options.storage || (
      typeof window !== 'undefined' && window.localStorage
        ? new LocalStorageProvider()
        : new MemoryStorageProvider()
    );
    
    this.dpop = new DPoPKeyManager();
  }

  private getFullUrl(path: string): string {
    return path.startsWith('http') ? path : `${this.serverUrl}${path}`;
  }

  async getAccessToken(): Promise<string | null> {
    return this.storage.getItem('kavach_access_token');
  }

  async getRefreshToken(): Promise<string | null> {
    return this.storage.getItem('kavach_refresh_token');
  }

  /**
   * Register a new user
   */
  async register(email?: string, password?: string, username?: string, metadata?: any): Promise<any> {
    const url = this.getFullUrl('/users/register');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': this.tenantId,
      },
      body: JSON.stringify({ email, password, username, metadata }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }

    return response.json();
  }

  /**
   * Log in user, generating DPoP signatures and storing sessions
   */
  async login(identifier: string, password: string, fingerprint: string = 'sdk-fingerprint'): Promise<any> {
    const url = this.getFullUrl('/auth/login');
    
    // Ensure DPoP ECDSA key pair is initialized on device
    await this.dpop.ensureKey();
    const dpopProof = await this.dpop.createProof('POST', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': this.tenantId,
        'dpop': dpopProof,
      },
      body: JSON.stringify({ identifier, password, fingerprint }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }

    const data = await response.json();
    
    // Save tokens in storage
    await this.storage.setItem('kavach_access_token', data.accessToken);
    await this.storage.setItem('kavach_refresh_token', data.refreshToken);
    
    return data;
  }

  /**
   * Refresh and rotate tokens
   */
  async refresh(): Promise<any> {
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const url = this.getFullUrl('/auth/refresh');
    const dpopProof = await this.dpop.createProof('POST', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': this.tenantId,
        'dpop': dpopProof,
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      // If refresh fails, clear tokens as session might be hijacked/revoked
      await this.storage.removeItem('kavach_access_token');
      await this.storage.removeItem('kavach_refresh_token');
      const errorData = await response.json();
      throw new Error(errorData.message || 'Session refresh failed');
    }

    const data = await response.json();
    
    // Save rotated tokens
    await this.storage.setItem('kavach_access_token', data.accessToken);
    await this.storage.setItem('kavach_refresh_token', data.refreshToken);

    return data;
  }

  /**
   * Log out and revoke session
   */
  async logout(): Promise<void> {
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) return;

    const url = this.getFullUrl('/auth/logout');
    const dpopProof = await this.dpop.createProof('POST', url);

    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': this.tenantId,
          'dpop': dpopProof,
        },
        body: JSON.stringify({ refreshToken }),
      });
    } catch (err) {
      console.warn('Network error during logout session revocation:', err);
    } finally {
      // Always remove tokens locally
      await this.storage.removeItem('kavach_access_token');
      await this.storage.removeItem('kavach_refresh_token');
    }
  }

  /**
   * Authenticated HTTP fetch wrapper with automatic DPoP signing and token refresh retry
   */
  async authenticatedFetch(path: string, init?: RequestInit): Promise<Response> {
    const url = this.getFullUrl(path);
    const method = init?.method || 'GET';
    let accessToken = await this.getAccessToken();

    if (!accessToken) {
      throw new Error('No access token available. Please log in first.');
    }

    // Prepare request headers and DPoP proof
    const headers = new Headers(init?.headers || {});
    headers.set('x-tenant-id', this.tenantId);
    headers.set('Authorization', `Bearer ${accessToken}`);
    
    const dpopProof = await this.dpop.createProof(method, url);
    headers.set('dpop', dpopProof);

    const requestInit: RequestInit = {
      ...init,
      method,
      headers,
    };

    let response = await fetch(url, requestInit);

    // If unauthorized, token might have expired. Try to refresh silently and retry request.
    if (response.status === 401) {
      try {
        const refreshData = await this.refresh();
        accessToken = refreshData.accessToken;
        
        // Re-sign headers with new access token and fresh DPoP proof
        const retryHeaders = new Headers(init?.headers || {});
        retryHeaders.set('x-tenant-id', this.tenantId);
        retryHeaders.set('Authorization', `Bearer ${accessToken}`);
        
        const retryDPoPProof = await this.dpop.createProof(method, url);
        retryHeaders.set('dpop', retryDPoPProof);
        
        response = await fetch(url, {
          ...init,
          method,
          headers: retryHeaders,
        });
      } catch (refreshErr) {
        console.error('Silent session refresh failed:', refreshErr);
        throw new Error('Session expired. Please log in again.');
      }
    }

    return response;
  }
}
export type { StorageProvider };
export { MemoryStorageProvider, LocalStorageProvider };
