import React, { useEffect, useState } from 'react';

interface RolesProps {
  token: string;
  tenantId: string;
}

export const Roles: React.FC<RolesProps> = ({ token, tenantId }) => {
  const [viewTab, setViewTab] = useState<'roles' | 'permissions'>('roles');
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');

  const [showPermForm, setShowPermForm] = useState(false);
  const [permResource, setPermResource] = useState('');
  const [permAction, setPermAction] = useState('');

  const [showMappingForm, setShowMappingForm] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedPermId, setSelectedPermId] = useState('');

  const headers = {
    'Authorization': `Bearer ${token}`,
    'x-tenant-id': tenantId,
  };

  const fetchRolesAndPerms = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetch('/roles', { headers }),
        fetch('/permissions', { headers }),
      ]);
      const rolesData = await rolesRes.json();
      const permsData = await permsRes.json();
      setRoles(rolesData.roles || []);
      setPermissions(permsData.permissions || []);
    } catch (err) {
      console.error('Error fetching roles and permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesAndPerms();
  }, [token, tenantId]);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ name: roleName, description: roleDesc }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create role');
      }

      setRoleName('');
      setRoleDesc('');
      setShowRoleForm(false);
      fetchRolesAndPerms();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreatePerm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ resource: permResource, action: permAction }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create permission');
      }

      setPermResource('');
      setPermAction('');
      setShowPermForm(false);
      fetchRolesAndPerms();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAssignPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoleId || !selectedPermId) return;

    try {
      const response = await fetch(`/roles/${selectedRoleId}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ permissionId: selectedPermId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to map permission');
      }

      setSelectedRoleId('');
      setSelectedPermId('');
      setShowMappingForm(false);
      fetchRolesAndPerms();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
        <button
          className={`btn`}
          style={{
            background: viewTab === 'roles' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
            borderRadius: '8px 8px 0 0',
            borderBottom: viewTab === 'roles' ? '2px solid var(--accent-color)' : 'none',
          }}
          onClick={() => setViewTab('roles')}
        >
          Roles
        </button>
        <button
          className={`btn`}
          style={{
            background: viewTab === 'permissions' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
            borderRadius: '8px 8px 0 0',
            borderBottom: viewTab === 'permissions' ? '2px solid var(--accent-color)' : 'none',
          }}
          onClick={() => setViewTab('permissions')}
        >
          Permissions
        </button>
      </div>

      <div className="actions-bar">
        <div></div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => setShowMappingForm(!showMappingForm)}>
            {showMappingForm ? 'Cancel' : 'Link Permission to Role'}
          </button>
          {viewTab === 'roles' ? (
            <button className="btn btn-primary" onClick={() => setShowRoleForm(!showRoleForm)}>
              {showRoleForm ? 'Cancel' : 'Create Role'}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setShowPermForm(!showPermForm)}>
              {showPermForm ? 'Cancel' : 'Create Permission'}
            </button>
          )}
        </div>
      </div>

      {showRoleForm && (
        <div className="glass-panel" style={{ padding: '28px', marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Create New Role</h3>
          <form onSubmit={handleCreateRole} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '20px', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Role Name</label>
              <input type="text" className="form-input" value={roleName} onChange={(e) => setRoleName(e.target.value)} required placeholder="Manager" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Description</label>
              <input type="text" className="form-input" value={roleDesc} onChange={(e) => setRoleDesc(e.target.value)} placeholder="Access to projects..." />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: '46px' }}>Save Role</button>
          </form>
        </div>
      )}

      {showPermForm && (
        <div className="glass-panel" style={{ padding: '28px', marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Create New Permission</h3>
          <form onSubmit={handleCreatePerm} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '20px', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Resource</label>
              <input type="text" className="form-input" value={permResource} onChange={(e) => setPermResource(e.target.value)} required placeholder="users" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Action</label>
              <input type="text" className="form-input" value={permAction} onChange={(e) => setPermAction(e.target.value)} required placeholder="read" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: '46px' }}>Save Permission</button>
          </form>
        </div>
      )}

      {showMappingForm && (
        <div className="glass-panel" style={{ padding: '28px', marginBottom: '32px', border: '1px solid var(--accent-color)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Link Permission to Role</h3>
          <form onSubmit={handleAssignPermission} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '20px', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Select Role</label>
              <select className="form-input" value={selectedRoleId} onChange={(e) => setSelectedRoleId(e.target.value)} required style={{ background: '#0f172a' }}>
                <option value="">-- Choose Role --</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Select Permission</label>
              <select className="form-input" value={selectedPermId} onChange={(e) => setSelectedPermId(e.target.value)} required style={{ background: '#0f172a' }}>
                <option value="">-- Choose Permission --</option>
                {permissions.map((p) => (
                  <option key={p.id} value={p.id}>{p.resource}:{p.action}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: '46px' }}>Link</button>
          </form>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ color: 'var(--text-muted)' }}>Loading records...</div>
        ) : viewTab === 'roles' ? (
          roles.length === 0 ? (
            <div style={{ color: 'var(--text-muted)' }}>No roles configured.</div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Role Name</th>
                    <th>Description</th>
                    <th>System Role</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.name}</td>
                      <td>{r.description || '—'}</td>
                      <td>
                        <span className={`badge ${r.isSystem ? 'badge-active' : 'badge-pending'}`}>
                          {r.isSystem ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : permissions.length === 0 ? (
          <div style={{ color: 'var(--text-muted)' }}>No permissions configured.</div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.resource}</td>
                    <td>
                      <span className="badge badge-role">{p.action}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
