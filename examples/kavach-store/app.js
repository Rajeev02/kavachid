import { KavachAuthHelper } from '../shared/auth-helper.js';

new KavachAuthHelper({
  appName: 'Kavach Store',
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

    // 2. Setup refund event handlers
    const tableBody = document.querySelector('#orders-table tbody');
    if (tableBody) {
      tableBody.addEventListener('click', async (e) => {
        const target = e.target;
        if (target.classList.contains('btn-refund')) {
          const order = target.getAttribute('data-order');
          const amount = target.getAttribute('data-amount');
          
          target.disabled = true;
          target.textContent = 'Refunding...';

          const statusDiv = document.getElementById('refund-status');
          statusDiv.style.display = 'block';
          statusDiv.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">Validating merchant permissions and signing refund payload...</p>`;

          // Simulate API dispatching
          setTimeout(() => {
            statusDiv.innerHTML = `
              <h4 class="success-text" style="font-weight: 600; margin-bottom: 0.5rem; font-size: 0.95rem;">✔ Refund Processed</h4>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.25rem;">Order: <strong>#ORD-${order}</strong></p>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.25rem;">Amount Refunded: <strong class="success-text">$${amount}</strong></p>
              <p style="font-size: 0.75rem; color: var(--success-color); margin-top: 0.5rem; font-family: monospace; font-weight: 600;">DPoP Audit event dispatched: role permission matched</p>
            `;
            target.disabled = false;
            target.textContent = 'Refund';
          }, 1100);
        }
      });
    }
  }
});

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
