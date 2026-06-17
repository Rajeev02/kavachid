import React, { useEffect, useState } from 'react';

interface DashboardProps {
  token: string;
  tenantId: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ token, tenantId }) => {
  const [stats, setStats] = useState({
    users: 0,
    sessions: 0,
    logs: 0,
    keys: 0,
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const headers = {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenantId,
        };

        // Fetch users count
        const usersRes = await fetch('/admin/users?limit=1', { headers });
        const usersData = await usersRes.json();

        // Fetch active sessions count
        const sessionsRes = await fetch('/admin/sessions?limit=1', { headers });
        const sessionsData = await sessionsRes.json();

        // Fetch recent logs
        const logsRes = await fetch('/admin/audit-logs?limit=5', { headers });
        const logsData = await logsRes.json();

        // Fetch JWKS keys count
        const keysRes = await fetch('/oauth/jwks');
        const keysData = await keysRes.json();

        setStats({
          users: usersData.total || 0,
          sessions: sessionsData.total || 0,
          logs: logsData.total || 0,
          keys: keysData.keys?.length || 0,
        });

        setRecentLogs(logsData.logs || []);
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token, tenantId]);

  if (loading) {
    return <div style={{ color: 'var(--text-muted)' }}>Loading metrics...</div>;
  }

  return (
    <div>
      <div className="dashboard-grid">
        <div className="stat-card glass-panel">
          <div className="stat-header">
            <span className="stat-title">Total Users</span>
            <span style={{ fontSize: '20px' }}>👥</span>
          </div>
          <div className="stat-value">{stats.users}</div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-header">
            <span className="stat-title">Active Sessions</span>
            <span style={{ fontSize: '20px' }}>💻</span>
          </div>
          <div className="stat-value">{stats.sessions}</div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-header">
            <span className="stat-title">Audit Events</span>
            <span style={{ fontSize: '20px' }}>📋</span>
          </div>
          <div className="stat-value">{stats.logs}</div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-header">
            <span className="stat-title">Public JWKs</span>
            <span style={{ fontSize: '20px' }}>🔑</span>
          </div>
          <div className="stat-value">{stats.keys}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', marginTop: '32px' }}>
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Recent Audit Activity</h2>
          {recentLogs.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No recent activities logged.</div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <span className="badge badge-role">{log.action}</span>
                      </td>
                      <td>{log.resourceType} ({log.resourceId || 'N/A'})</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="glass-panel" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>System Info</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Deployment Mode</div>
              <div style={{ fontWeight: 500 }}>Multi-Tenant Standalone</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Status</div>
              <div style={{ color: 'var(--success-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success-color)' }}></span> Online
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Tenant Context</div>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>{tenantId}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
