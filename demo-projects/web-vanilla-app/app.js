import { KavachClient } from '../../kavach-sdk/dist/index.js';

// Setup parameters (Default tenant uuid created during DB seed)
const client = new KavachClient({
  serverUrl: 'http://localhost:3000',
  tenantId: '123e4567-e89b-12d3-a456-426614174000',
});

const authPanel = document.getElementById('auth-panel');
const dashboardPanel = document.getElementById('dashboard-panel');
const loginForm = document.getElementById('login-form');
const errorBox = document.getElementById('error-box');
const claimsBox = document.getElementById('claims-box');
const userBadge = document.getElementById('user-badge');
const sessionsList = document.getElementById('sessions-list');

const showError = (msg) => {
  if (msg) {
    errorBox.textContent = msg;
    errorBox.style.display = 'block';
  } else {
    errorBox.style.display = 'none';
  }
};

const updateUI = async () => {
  const token = await client.getAccessToken();
  if (token) {
    authPanel.style.display = 'none';
    dashboardPanel.style.display = 'block';
    
    // Parse JWT claims
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userBadge.textContent = payload.email || payload.username || 'Authenticated';
      claimsBox.textContent = JSON.stringify(payload, null, 2);
    } catch (e) {
      claimsBox.textContent = 'Unable to decode token payload';
    }

    // Load active sessions
    try {
      const data = await client.getSessions();
      sessionsList.innerHTML = (data.sessions || [])
        .map(s => `
          <div class="session-item">
            <strong>IP:</strong> ${s.ipAddress} <br>
            <strong>Agent:</strong> ${s.userAgent} <br>
            <strong>Created:</strong> ${new Date(s.createdAt).toLocaleTimeString()}
          </div>
        `).join('');
    } catch(err) {
      sessionsList.innerHTML = '<div style="color: var(--text-muted);">Failed to load sessions</div>';
    }
  } else {
    authPanel.style.display = 'block';
    dashboardPanel.style.display = 'none';
  }
};

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  showError(null);
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    await client.login(email, password);
    await updateUI();
  } catch (err) {
    showError(err.message || 'Login failed');
  }
});

document.getElementById('passkey-btn').addEventListener('click', async () => {
  showError(null);
  const email = document.getElementById('email').value || prompt('Enter your email to sign in:');
  if (!email) return;

  try {
    await client.loginWithPasskey(email);
    await updateUI();
  } catch (err) {
    showError(err.message || 'Passkey authentication failed');
  }
});

document.getElementById('register-passkey-btn').addEventListener('click', async () => {
  try {
    await client.registerPasskey();
    alert('Passkey successfully registered!');
  } catch (err) {
    alert('Failed to register passkey: ' + err.message);
  }
});

document.getElementById('test-api-btn').addEventListener('click', async () => {
  try {
    // Call the demo backend app running on port 3001 (which validates via KavachID JWKS)
    const res = await client.authenticatedFetch('http://localhost:3001/resource/public-info');
    const data = await res.json();
    alert('Protected resource response:\n' + JSON.stringify(data, null, 2));
  } catch (err) {
    alert('API request failed: ' + err.message);
  }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await client.logout();
  window.location.reload();
});

// Initial boot check
updateUI();
