import React, { useEffect, useState } from 'react';

interface UsersProps {
  token: string;
  tenantId: string;
}

export const Users: React.FC<UsersProps> = ({ token, tenantId }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // New User Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Role Assignment State
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'x-tenant-id': tenantId,
      };
      const query = `page=${page}&limit=10${search ? `&search=${encodeURIComponent(search)}` : ''}`;
      const res = await fetch(`/admin/users?${query}`, { headers });
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'x-tenant-id': tenantId,
      };
      const res = await fetch('/roles', { headers });
      const data = await res.json();
      setRoles(data.roles || []);
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search, token, tenantId]);

  useEffect(() => {
    fetchRoles();
  }, [token, tenantId]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify({ email, username: username || undefined, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create user');
      }

      setEmail('');
      setUsername('');
      setPassword('');
      setShowAddForm(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !selectedRoleId) return;

    try {
      const response = await fetch(`/users/${selectedUserId}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify({ roleId: selectedRoleId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to assign role');
      }

      setShowRoleModal(false);
      setSelectedUserId(null);
      setSelectedRoleId('');
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="actions-bar">
        <div className="search-box">
          <input
            type="text"
            className="form-input"
            placeholder="Search email/username..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ width: '100%' }}
          />
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : 'Register User'}
        </button>
      </div>

      {showAddForm && (
        <div className="glass-panel" style={{ padding: '28px', marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Register New User</h3>
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={handleAddUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Username (Optional)</label>
              <input type="text" className="form-input" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password</label>
              <input type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: '46px' }}>Save User</button>
          </form>
        </div>
      )}

      {showRoleModal && (
        <div className="glass-panel" style={{ padding: '28px', marginBottom: '32px', border: '1px solid var(--accent-color)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Assign Role to User</h3>
          <form onSubmit={handleAssignRole} style={{ display: 'flex', gap: '16px', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0, flexGrow: 1 }}>
              <label className="form-label">Select Role</label>
              <select className="form-input" value={selectedRoleId} onChange={(e) => setSelectedRoleId(e.target.value)} required style={{ background: '#0f172a' }}>
                <option value="">-- Choose Role --</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} ({r.description || 'no description'})</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: '46px' }}>Assign</button>
            <button type="button" className="btn btn-secondary" style={{ height: '46px' }} onClick={() => setShowRoleModal(false)}>Cancel</button>
          </form>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ color: 'var(--text-muted)' }}>Loading users...</div>
        ) : users.length === 0 ? (
          <div style={{ color: 'var(--text-muted)' }}>No users found.</div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Migration</th>
                  <th>Roles</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td style={{ fontWeight: 500 }}>{user.username || '—'}</td>
                    <td>{user.email || '—'}</td>
                    <td>
                      <span className={`badge ${user.status === 'active' ? 'badge-active' : 'badge-pending'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-secondary">{user.migrationStatus}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {user.roles.length === 0 ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>None</span>
                        ) : (
                          user.roles.map((role: any) => (
                            <span key={role.id} className="badge badge-role">{role.name}</span>
                          ))
                        )}
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setShowRoleModal(true);
                        }}
                      >
                        Assign Role
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
