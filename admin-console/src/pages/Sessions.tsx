import React, { useEffect, useState } from 'react';

interface SessionsProps {
  token: string;
  tenantId: string;
}

export const Sessions: React.FC<SessionsProps> = ({ token, tenantId }) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const headers = {
    'Authorization': `Bearer ${token}`,
    'x-tenant-id': tenantId,
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/admin/sessions?page=${page}&limit=10`, { headers });
      const data = await res.json();
      setSessions(data.sessions || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Error fetching active sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [page, token, tenantId]);

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke this session? The user will be instantly logged out.')) {
      return;
    }

    try {
      const response = await fetch(`/admin/sessions/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to revoke session');
      }

      alert('Session revoked successfully.');
      fetchSessions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ color: 'var(--text-muted)' }}>Loading active sessions...</div>
        ) : sessions.length === 0 ? (
          <div style={{ color: 'var(--text-muted)' }}>No active sessions found.</div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>IP Address</th>
                  <th>User-Agent</th>
                  <th>Risk Score</th>
                  <th>Last Seen</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((sess) => (
                  <tr key={sess.id}>
                    <td style={{ fontWeight: 500 }}>
                      {sess.user?.email || sess.user?.username || sess.userId}
                    </td>
                    <td>{sess.ipAddress}</td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sess.userAgent}>
                      {sess.userAgent || 'unknown'}
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: parseFloat(sess.riskScore) > 3.0 ? 'rgba(239, 68, 68, 0.15)' : parseFloat(sess.riskScore) > 1.0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: parseFloat(sess.riskScore) > 3.0 ? 'var(--danger-color)' : parseFloat(sess.riskScore) > 1.0 ? 'var(--warning-color)' : 'var(--success-color)',
                        }}
                      >
                        {parseFloat(sess.riskScore).toFixed(2)}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {new Date(sess.lastSeenAt).toLocaleString()}
                    </td>
                    <td>
                      <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleRevoke(sess.id)}>
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="pagination">
        <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
        <span className="page-num">Page {page} of {Math.ceil(total / 10) || 1}</span>
        <button className="btn btn-secondary" disabled={page >= Math.ceil(total / 10)} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
};
