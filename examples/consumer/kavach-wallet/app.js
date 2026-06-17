import { KavachAuthHelper } from '../../shared/auth-helper.js';

new KavachAuthHelper({
  appName: 'Kavach Wallet',
  onAuthSuccess: async (client) => {
    // 1. Fetch active sessions using the SDK's authenticatedFetch
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

    // 2. Setup transaction payment mock form
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
      paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const recipient = document.getElementById('recipient').value;
        const amount = document.getElementById('amount').value;
        
        const submitBtn = document.getElementById('send-payment-btn');
        submitBtn.disabled = true;
        
        const statusDiv = document.getElementById('payment-status');
        statusDiv.style.display = 'block';
        statusDiv.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">Processing DPoP transaction...</p>`;

        setTimeout(() => {
          statusDiv.innerHTML = `
            <h4 class="success-text" style="font-weight: 600; margin-bottom: 0.5rem; font-size: 0.95rem;">✔ Transaction Authorized</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.25rem;">Recipient: <strong>${recipient}</strong></p>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.25rem;">Amount: <strong>$${amount}</strong></p>
            <p style="font-size: 0.75rem; color: var(--success-color); margin-top: 0.5rem; font-family: monospace; font-weight: 600;">Bound signature: verified on KavachID</p>
          `;
          submitBtn.disabled = false;
          paymentForm.reset();
        }, 1000);
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
