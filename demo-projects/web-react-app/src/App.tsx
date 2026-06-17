import React, { useState } from 'react';
import { useKavach } from '@kavachid/react';

// CSS embedded directly for zero-setup ease of use
const css = `
  body {
    margin: 0;
    font-family: system-ui, -apple-system, sans-serif;
    background: linear-gradient(135deg, #090d16 0%, #111428 100%);
    color: #f8fafc;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(16px);
    border-radius: 16px;
    padding: 2.5rem;
    width: 420px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.4);
  }
  .input {
    width: 100%;
    padding: 0.75rem;
    margin-bottom: 1rem;
    border-radius: 8px;
    background: rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.08);
    color: white;
    box-sizing: border-box;
  }
  .btn {
    width: 100%;
    padding: 0.75rem;
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: 0.75rem;
  }
  .btn-sec {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
  }
  .badge {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }
`;

function App() {
  const { isAuthenticated, isLoading, user, error, login, logout, client } = useKavach();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      console.error('Login failed', err);
    }
  };

  const handlePasskeyLogin = async () => {
    if (!client) return;
    const identifier = email || prompt('Enter your username or email:');
    if (!identifier) return;
    try {
      await client.loginWithPasskey(identifier);
      window.location.reload(); // Reload to capture the logged-in context
    } catch (err: any) {
      alert('Passkey Authentication Failed: ' + err.message);
    }
  };

  const handleRegisterPasskey = async () => {
    if (!client) return;
    try {
      await client.registerPasskey();
      alert('Passkey successfully registered!');
    } catch (err: any) {
      alert('Passkey registration failed: ' + err.message);
    }
  };

  const handleTestAPI = async () => {
    if (!client) return;
    try {
      const res = await client.authenticatedFetch('http://localhost:3001/resource/sensitive-data');
      if (!res.ok) throw new Error('API returned status ' + res.status);
      const data = await res.json();
      alert('Secure API Response:\n' + JSON.stringify(data, null, 2));
    } catch (err: any) {
      alert('API Request Failed: ' + err.message);
    }
  };

  if (isLoading) {
    return <div>Loading session status...</div>;
  }

  return (
    <>
      <style>{css}</style>
      <div className="card">
        <h2><img src="https://raw.githubusercontent.com/Rajeev02/kavachid/main/assets/logo-icon-only.png" width="24" height="24" alt="KavachID Shield" style="vertical-align: middle;" /> KavachID React</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>React Hooks SDK Demonstration</p>

        {error && <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

        {!isAuthenticated ? (
          <form onSubmit={handleLogin}>
            <input
              type="text"
              className="input"
              placeholder="Email or Username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              className="input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="btn">Sign In</button>
            <button type="button" className="btn btn-sec" onClick={handlePasskeyLogin}>🔐 Sign In with Passkey</button>
          </form>
        ) : (
          <div>
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>User ID: <span style={{ fontFamily: 'monospace' }}>{user?.id?.substring(0, 8)}...</span></span>
              <span className="badge">Active</span>
            </div>
            
            <button className="btn btn-sec" onClick={handleRegisterPasskey}>➕ Register biometric Passkey</button>
            <button className="btn btn-sec" onClick={handleTestAPI}>📡 Request Role Protected API</button>
            <button className="btn btn-sec" style={{ color: '#ef4444' }} onClick={logout}>Log Out</button>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
