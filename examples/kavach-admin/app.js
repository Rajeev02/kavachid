import { KavachAuthHelper } from '../shared/auth-helper.js';

new KavachAuthHelper({
  appName: 'Kavach Admin',
  ssoMode: 'prompt',
  onAuthSuccess: async (client) => {
    // 1. Fetch active sessions using the SDK
    try {
      const res = await client.authenticatedFetch('/auth/sessions');
      if (res.ok) {
        const data = await res.json();
        renderSessions(data.sessions);
      } else {
        document.getElementById('sessions-list').innerHTML = `<p style="color: var(--danger-color);">Failed to load sessions</p>`;
      }
    } catch (err) {
      document.getElementById('sessions-list').innerHTML = `<p style="color: var(--danger-color);">${err.message}</p>`;
    }

    // 2. Fetch tenant users list from admin console API
    await fetchUsersList(client);

    const refreshBtn = document.getElementById('refresh-users-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        await fetchUsersList(client);
      });
    }

    // 3. Initialize Log Stream
    startLogStream(client);
    
    const refreshLogsBtn = document.getElementById('refresh-logs-btn');
    if (refreshLogsBtn) {
      refreshLogsBtn.addEventListener('click', () => {
        startLogStream(client);
      });
    }
  }
});

async function fetchUsersList(client) {
  const tableBody = document.querySelector('#users-table tbody');
  const statsUsers = document.getElementById('stats-total-users');
  const statusDiv = document.getElementById('admin-status');

  tableBody.innerHTML = `<tr><td colspan="4" style="color: var(--text-muted);">Loading users list from KavachID Core API...</td></tr>`;

  try {
    const res = await client.authenticatedFetch('/admin/users?page=1&limit=10');
    if (res.ok) {
      const result = await res.json();
      const users = result.data || [];
      statsUsers.textContent = users.length;
      statusDiv.style.display = 'none';

      if (users.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" style="color: var(--text-muted); text-align: center;">No users found.</td></tr>`;
        return;
      }

      tableBody.innerHTML = users.map(user => `
        <tr>
          <td><span style="font-family: monospace; font-size: 0.8rem; color: var(--accent-color);">${user.id.substring(0, 8)}...</span></td>
          <td>${user.email || 'N/A'}</td>
          <td>${user.username || 'N/A'}</td>
          <td><span class="badge" style="background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); color: var(--success-color);">${user.status}</span></td>
        </tr>
      `).join('');
    } else {
      const errText = await res.text();
      let msg = 'Failed to load user list';
      try {
        const errJson = JSON.parse(errText);
        msg = errJson.message || msg;
      } catch {}

      tableBody.innerHTML = `<tr><td colspan="4" style="color: var(--danger-color); text-align: center;">Error: Forbidden Access</td></tr>`;
      
      statusDiv.style.display = 'block';
      statusDiv.innerHTML = `
        <h4 style="color: var(--danger-color); font-weight: 600; margin-bottom: 0.5rem; font-size: 0.95rem;">⚠️ Authorization Warning</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">
          Your user is authenticated, but does not have the required <strong>users:read</strong> permission assigned inside this tenant context.
        </p>
        <p style="font-size: 0.75rem; color: var(--accent-color); margin-top: 0.5rem;">
          To grant permissions, make a POST call to assign roles or use the central admin dashboard.
        </p>
      `;
    }
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="4" style="color: var(--danger-color); text-align: center;">Network connection error</td></tr>`;
  }
}

function renderSessions(sessions) {
  const container = document.getElementById('sessions-list');
  if (!sessions || sessions.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">No active sessions found.</p>`;
    return;
  }
  
  container.innerHTML = sessions.map(session => `
    <div class="session-info">
      <div class="session-details">
        <div style="font-weight: 600; font-size: 0.85rem;">IP: ${session.ipAddress}</div>
        <div class="session-meta">${session.userAgent.substring(0, 50)}...</div>
      </div>
      <div style="font-size: 0.75rem; font-family: monospace; color: var(--accent-color);">${session.id.substring(0, 8)}...</div>
    </div>
  `).join('');
}

function startLogStream(client) {
  const container = document.getElementById('logs-container');
  container.innerHTML = '<div style="color: var(--success-color);">[SYS] Connecting to Audit Log Stream... OK.</div>';
  
  const events = [
    "[AUTH] User session created for tenant 'kavach-store'",
    "[DPoP] Signature verified for request /api/v1/store/orders",
    "[RBAC] Permission 'orders:read' granted",
    "[AUDIT] Admin user triggered manual rotation of JWKS keys",
    "[WARN] High latency detected on database node 2",
    "[AUTH] Token refreshed successfully",
    "[WEBHOOK] Payload delivered to https://api.kavach-analytics.local/ingest",
    "[SYS] Cache invalidated for user roles"
  ];
  
  let i = 0;
  clearInterval(window.logInterval);
  window.logInterval = setInterval(() => {
    if (i >= events.length) i = 0;
    const time = new Date().toISOString().substring(11, 19);
    const div = document.createElement('div');
    div.style.marginBottom = '0.25rem';
    div.textContent = `${time} ${events[i]}`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    i++;
  }, 2000);
}
