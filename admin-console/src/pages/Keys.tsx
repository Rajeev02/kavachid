import React, { useEffect, useState } from 'react';

interface KeysProps {
  token: string;
  tenantId: string;
}

export const Keys: React.FC<KeysProps> = ({ token, tenantId }) => {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch('/oauth/jwks');
      const data = await res.json();
      setKeys(data.keys || []);
    } catch (err) {
      console.error('Error fetching key sets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleRotate = async (alg: string) => {
    if (!window.confirm(`Are you sure you want to rotate the ${alg} signing keys? This will expire current keys and generate a new key pair.`)) {
      return;
    }

    setRotating(true);
    try {
      const response = await fetch(`/admin/keys/rotate?alg=${alg}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenantId,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Key rotation failed');
      }

      alert('Signing keys rotated successfully!');
      fetchKeys();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRotating(false);
    }
  };

  return (
    <div>
      <div className="actions-bar">
        <div></div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={() => handleRotate('RS256')} disabled={rotating}>
            {rotating ? 'Rotating...' : 'Rotate RS256 Keys'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>Loading key sets...</div>
      ) : keys.length === 0 ? (
        <div style={{ color: 'var(--text-muted)' }}>No public keys found.</div>
      ) : (
        <div className="key-detail-grid">
          {keys.map((key) => (
            <div key={key.kid} className="key-card glass-panel">
              <div className="key-badge-container">
                <span className="badge badge-active">{key.use}</span>
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px', color: 'var(--accent-color)' }}>
                Algorithm: {key.alg}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <div>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Key ID (kid):</span>{' '}
                  <span style={{ fontFamily: 'monospace' }}>{key.kid}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Type (kty):</span> {key.kty}
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Modulus (n):</span>
                <div className="key-pem-area">{key.n}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
