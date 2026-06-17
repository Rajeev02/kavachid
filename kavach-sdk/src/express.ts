import { KavachShieldClient, KseEvaluationRequest } from './kse.js';

export interface KseMiddlewareOptions {
    level: number;
    actionType: string;
    productName: string;
    featureName?: string;
    kseBaseUrl: string;
    getTenantId: (req: any) => string;
    getUserId: (req: any) => string;
    getSessionId: (req: any) => string;
}

/**
 * Express middleware for enforcing Kavach Shield Engine policies.
 * We use `any` for Express Request/Response to avoid tight coupling in the SDK.
 */
export function kseEnforce(options: KseMiddlewareOptions) {
    const client = new KavachShieldClient(options.kseBaseUrl);

    return async (req: any, res: any, next: any) => {
        try {
            const evaluationReq: KseEvaluationRequest = {
                requestId: `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                tenantId: options.getTenantId(req),
                userId: options.getUserId(req),
                sessionId: options.getSessionId(req),
                targetSecurityLevel: options.level,
                actionType: options.actionType,
                productName: options.productName,
                featureName: options.featureName,
                deviceFingerprint: req.headers['x-device-fingerprint'] || 'unknown',
                network: {
                    ipAddress: req.ip || req.socket?.remoteAddress || 'unknown',
                    userAgent: req.headers['user-agent'] || 'unknown'
                },
                actionMetadata: req.body
            };

            const result = await client.evaluate(evaluationReq);

            if (result.decision === 'DENY') {
                return res.status(403).json({ error: 'Access Denied', reason: result.reason_code });
            }

            if (result.decision === 'STEP_UP_REQUIRED') {
                return res.status(401).json({ 
                    error: 'Step Up Required', 
                    decision: result.decision,
                    required_controls: result.required_controls 
                });
            }

            // ALLOW
            next();
        } catch (error) {
            console.error('KSE Middleware Error:', error);
            // Fail closed on evaluation failure
            res.status(500).json({ error: 'Internal Security Error' });
        }
    };
}
