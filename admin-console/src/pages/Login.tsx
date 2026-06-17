import React, { useState } from 'react';

interface LoginProps {
  onLoginSuccess: (data: { token: string; tenantId: string; email: string }) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [tenantId, setTenantId] = useState('123e4567-e89b-12d3-a456-426614174000'); // Default test tenant UUID
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !identifier || !password) {
      setError('All fields are required.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify({ identifier, password, fingerprint: 'admin-console-fingerprint' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Authentication failed');
      }

      const data = await response.json();
      onLoginSuccess({
        token: data.accessToken,
        tenantId,
        email: identifier,
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card glass-panel">
        <div className="login-header">
          <div style={{ display: 'inline-flex', padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>🛡️</div>
          <h1 className="login-title">KavachID Admin</h1>
          <p className="login-subtitle">Control plane authorization dashboard</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Tenant ID (UUID)</label>
            <input
              type="text"
              className="form-input"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email or Username</label>
            <input
              type="text"
              className="form-input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="admin@kavachid.local"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} disabled={loading}>
            {loading ? 'Logging in...' : 'Access Console'}
          </button>
        </form>
      </div>
    </div>
  );
};
