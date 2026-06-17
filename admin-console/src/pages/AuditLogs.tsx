import React, { useEffect, useState } from 'react';

interface AuditLogsProps {
  token: string;
  tenantId: string;
}

export const AuditLogs: React.FC<AuditLogsProps> = ({ token, tenantId }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Inspector State
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const headers = {
    'Authorization': `Bearer ${token}`,
    'x-tenant-id': tenantId,
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const query = `page=${page}&limit=10${search ? `&search=${encodeURIComponent(search)}` : ''}`;
      const res = await fetch(`/admin/audit-logs?${query}`, { headers });
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, search, token, tenantId]);

  return (
    <div>
      <div className="actions-bar">
        <div className="search-box">
          <input
            type="text"
            className="form-input"
            placeholder="Search action or resource..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ width: '100%' }}
          />
        </div>
        <div></div>
      </div>

      {selectedLog && (
        <div className="glass-panel" style={{ padding: '28px', marginBottom: '32px', border: '1px solid var(--accent-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Audit Event Inspector</h3>
            <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => setSelectedLog(null)}>
              Close
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', fontSize: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Event ID:</span>
                <div style={{ fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>{selectedLog.id}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Action:</span>
                <div><span className="badge badge-role">{selectedLog.action}</span></div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Resource:</span>
                <div>{selectedLog.resourceType} ({selectedLog.resourceId || '—'})</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Actor ID:</span>
                <div style={{ fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>{selectedLog.actorId || '—'}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Timestamp:</span>
                <div>{new Date(selectedLog.createdAt).toLocaleString()}</div>
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Event Metadata:</span>
              <pre className="json-pre">
                {JSON.stringify(selectedLog.metadata || {}, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ color: 'var(--text-muted)' }}>Loading audit records...</div>
        ) : logs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)' }}>No audit events found.</div>
        ) : (
          <div className="table-container">
            <table className="custom-table text-left">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Actor</th>
                  <th>Timestamp</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontWeight: 600 }}>
                      <span className="badge badge-role">{log.action}</span>
                    </td>
                    <td>{log.resourceType} ({log.resourceId || '—'})</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {log.actorId ? `${log.actorId.substring(0, 8)}...` : '—'}
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => setSelectedLog(log)}
                      >
                        Inspect
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
