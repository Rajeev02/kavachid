/**
 * Kavach Shield Engine (KSE) Client & Utilities
 */

export interface KseEvaluationRequest {
    requestId: string;
    tenantId: string;
    userId: string;
    sessionId: string;
    targetSecurityLevel: number;
    actionType: string;
    productName: string;
    featureName?: string;
    deviceFingerprint: string;
    network: {
        ipAddress: string;
        userAgent: string;
    };
    actionMetadata?: Record<string, any>;
}

export interface KseEvaluationResponse {
    decision: 'ALLOW' | 'DENY' | 'STEP_UP_REQUIRED';
    risk_score: number;
    reason_code: string;
    required_controls: string[];
    evaluation_id: string;
}

export class KavachShieldClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    }

    async evaluate(req: KseEvaluationRequest): Promise<KseEvaluationResponse> {
        const response = await fetch(`${this.baseUrl}/v1/kse/evaluate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req)
        });

        if (!response.ok) {
            throw new Error(`KSE Evaluation failed with status: ${response.status}`);
        }

        return await response.json();
    }
}

/**
 * Utility to generate a basic device fingerprint for KSE.
 * In a real production app, this should use native device attestation APIs.
 */
export async function generateDeviceFingerprint(): Promise<string> {
    const nav = typeof navigator !== 'undefined' ? navigator : { userAgent: 'unknown', language: 'unknown' };
    const platform = (nav as any)?.platform || 'unknown';
    const hardwareConcurrency = (nav as any)?.hardwareConcurrency || 1;
    const deviceMemory = (nav as any)?.deviceMemory || 1;
    
    const rawFingerprint = `${nav.userAgent}|${nav.language}|${platform}|${hardwareConcurrency}|${deviceMemory}|${new Date().getTimezoneOffset()}`;
    
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(rawFingerprint);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback if Web Crypto is not available (e.g. older Node without global crypto)
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(rawFingerprint).toString('base64');
    }

    // Last resort fallback
    return rawFingerprint.replace(/[^a-zA-Z0-9]/g, '');
}
