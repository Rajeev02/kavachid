import React, { useState, useEffect } from 'react';
import './styles/admin.css';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Users } from './pages/Users';
import { Roles } from './pages/Roles';
import { Keys } from './pages/Keys';
import { Sessions } from './pages/Sessions';
import { AuditLogs } from './pages/AuditLogs';

interface AuthData {
  token: string;
  tenantId: string;
  email: string;
}

export const App: React.FC = () => {
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'roles' | 'keys' | 'sessions' | 'audit'>('dashboard');

  useEffect(() => {
    const storedToken = localStorage.getItem('kavach_token');
    const storedTenantId = localStorage.getItem('kavach_tenant_id');
    const storedEmail = localStorage.getItem('kavach_email');

    if (storedToken && storedTenantId && storedEmail) {
      setAuthData({
        token: storedToken,
        tenantId: storedTenantId,
        email: storedEmail,
      });
    }
  }, []);

  const handleLoginSuccess = (data: AuthData) => {
    localStorage.setItem('kavach_token', data.token);
    localStorage.setItem('kavach_tenant_id', data.tenantId);
    localStorage.setItem('kavach_email', data.email);
    setAuthData(data);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('kavach_token');
    localStorage.removeItem('kavach_tenant_id');
    localStorage.removeItem('kavach_email');
    setAuthData(null);
  };

  if (!authData) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard token={authData.token} tenantId={authData.tenantId} />;
      case 'users':
        return <Users token={authData.token} tenantId={authData.tenantId} />;
      case 'roles':
        return <Roles token={authData.token} tenantId={authData.tenantId} />;
      case 'keys':
        return <Keys token={authData.token} tenantId={authData.tenantId} />;
      case 'sessions':
        return <Sessions token={authData.token} tenantId={authData.tenantId} />;
      case 'audit':
        return <AuditLogs token={authData.token} tenantId={authData.tenantId} />;
      default:
        return <Dashboard token={authData.token} tenantId={authData.tenantId} />;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'System Dashboard';
      case 'users':
        return 'User Directory';
      case 'roles':
        return 'Roles & Mapped Permissions';
      case 'keys':
        return 'Key Rotation & JWKS';
      case 'sessions':
        return 'Active Logins & Sessions';
      case 'audit':
        return 'Security Audit Logs';
      default:
        return 'Console';
    }
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo-container">
          <span style={{ fontSize: '24px' }}><img src="https://raw.githubusercontent.com/Rajeev02/kavachid/main/assets/logo-icon-only.png" width="24" height="24" alt="KavachID Shield" style="vertical-align: middle;" /></span>
          <span className="logo-text">KavachID</span>
        </div>

        <nav className="nav-links">
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <span>📊</span> Dashboard
          </div>
          <div className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            <span>👥</span> Users
          </div>
          <div className={`nav-item ${activeTab === 'roles' ? 'active' : ''}`} onClick={() => setActiveTab('roles')}>
            <span>🔑</span> Roles & Permissions
          </div>
          <div className={`nav-item ${activeTab === 'keys' ? 'active' : ''}`} onClick={() => setActiveTab('keys')}>
            <span><img src="https://raw.githubusercontent.com/Rajeev02/kavachid/main/assets/logo-icon-only.png" width="24" height="24" alt="KavachID Shield" style="vertical-align: middle;" /></span> Key Management
          </div>
          <div className={`nav-item ${activeTab === 'sessions' ? 'active' : ''}`} onClick={() => setActiveTab('sessions')}>
            <span>💻</span> Active Sessions
          </div>
          <div className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>
            <span>📋</span> Audit Logs
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">
              {authData.email.substring(0, 2).toUpperCase()}
            </div>
            <div className="user-info">
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Administrator</span>
              <span className="user-email" title={authData.email}>{authData.email}</span>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          <h1 className="page-title">{getPageTitle()}</h1>
          <div className="tenant-badge">
            Tenant: {authData.tenantId}
          </div>
        </header>

        <div className="content-body">
          {renderActivePage()}
        </div>
      </main>
    </div>
  );
};

export default App;
