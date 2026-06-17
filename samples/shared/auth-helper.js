import { KavachClient } from './lib/kavach-sdk/dist/index.js';

/**
 * Shared authentication wrapper logic for KavachID demo apps.
 */
export class KavachAuthHelper {
  constructor(config = {}) {
    this.serverUrl = config.serverUrl || 'http://localhost:3000';
    this.tenantId = config.tenantId || '123e4567-e89b-12d3-a456-426614174000';
    this.clientId = config.clientId;
    this.appName = config.appName || 'KavachID App';
    this.ssoMode = config.ssoMode || 'silent';
    this.onAuthSuccess = config.onAuthSuccess || (() => {});
    
    this.client = new KavachClient({
      serverUrl: this.serverUrl,
      tenantId: this.tenantId,
      clientId: this.clientId,
      ssoMode: this.ssoMode
    });

    this.init();
  }

  async init() {
    this.setupDOMElements();
    this.setupListeners();
    await this.checkAuthStatus();
  }

  setupDOMElements() {
    this.authView = document.getElementById('auth-view');
    this.dashboardView = document.getElementById('dashboard-view');
    this.errorBanner = document.getElementById('error-banner');
    
    // Set headers
    const appNameElements = document.querySelectorAll('.app-name');
    appNameElements.forEach(el => el.textContent = this.appName);

    // Setup basic login form inside auth-view if empty
    if (this.authView && this.authView.children.length === 0) {
      this.authView.innerHTML = `
        <div class="auth-panel">
          <h2><img src="https://raw.githubusercontent.com/Rajeev02/kavachid/main/assets/logo-icon-only.png" width="24" height="24" alt="KavachID Shield" style="vertical-align: middle;" /> <span class="app-name">${this.appName}</span></h2>
          <p>Secure authentication powered by KavachID</p>
          
          <div class="error-banner" id="error-banner"></div>
          
          <form id="auth-form">
            <div class="form-group" id="username-group" style="display: none;">
              <label for="reg-username">Username</label>
              <input type="text" id="reg-username" placeholder="Enter username">
            </div>
            
            <div class="form-group">
              <label for="auth-email">Email Address</label>
              <input type="email" id="auth-email" required placeholder="name@domain.com">
            </div>
            
            <div class="form-group">
              <label for="auth-password">Password</label>
              <input type="password" id="auth-password" required placeholder="••••••••">
            </div>
            
            <button type="submit" class="btn btn-full" id="auth-submit-btn">Sign In</button>
            <div style="margin: 1rem 0; text-align: center; color: var(--text-muted);">— OR —</div>
            <button type="button" class="btn btn-full btn-secondary" id="auth-passkey-btn">🔐 Sign In with Passkey</button>
          </form>
          
          <div class="toggle-auth">
            Don't have an account? <span id="toggle-action">Register</span>
          </div>
        </div>
      `;
      this.errorBanner = document.getElementById('error-banner');
    }
  }

  setupListeners() {
    const toggleAction = document.getElementById('toggle-action');
    const authForm = document.getElementById('auth-form');
    const usernameGroup = document.getElementById('username-group');
    const submitBtn = document.getElementById('auth-submit-btn');

    this.isRegisterMode = false;

    if (toggleAction) {
      toggleAction.addEventListener('click', () => {
        this.isRegisterMode = !this.isRegisterMode;
        if (this.isRegisterMode) {
          usernameGroup.style.display = 'block';
          submitBtn.textContent = 'Register Account';
          toggleAction.textContent = 'Sign In';
        } else {
          usernameGroup.style.display = 'none';
          submitBtn.textContent = 'Sign In';
          toggleAction.textContent = 'Register';
        }
      });
    }

    if (authForm) {
      authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        const username = document.getElementById('reg-username')?.value;

        submitBtn.disabled = true;
        this.showError(null);

        try {
          if (this.isRegisterMode) {
            // Register
            await this.client.register(email, password, username || email.split('@')[0]);
            // Auto login after register
            await this.client.login(email, password);
          } else {
            // Login
            await this.client.login(email, password);
          }
          await this.checkAuthStatus();
        } catch (err) {
          this.showError(err.message || 'Authentication operation failed');
        } finally {
          submitBtn.disabled = false;
        }
      });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        if (this.ssoMode === 'prompt') {
          // Log out of THIS app only (remove from consented list)
          try {
            let consentedApps = JSON.parse(localStorage.getItem('kavach_consented_apps') || '[]');
            consentedApps = consentedApps.filter(app => app !== this.appName);
            localStorage.setItem('kavach_consented_apps', JSON.stringify(consentedApps));
          } catch(e) {}
          window.location.reload();
        } else {
          // Fallback to global logout if not using SSO prompt mode
          try {
            await this.client.logout();
          } catch (err) {
            console.warn('Logout failed', err);
          }
          window.location.reload();
        }
      });
    }

    const passkeyBtn = document.getElementById('auth-passkey-btn');
    if (passkeyBtn) {
      passkeyBtn.addEventListener('click', async () => {
        const identifier = document.getElementById('auth-email').value || prompt('Enter your email or username to login with Passkey:');
        if (!identifier) return;

        passkeyBtn.disabled = true;
        this.showError(null);
        try {
          await this.client.loginWithPasskey(identifier);
          await this.checkAuthStatus();
        } catch (err) {
          this.showError(err.message || 'Passkey login failed');
        } finally {
          passkeyBtn.disabled = false;
        }
      });
    }
  }

  showError(message) {
    if (!this.errorBanner) return;
    if (message) {
      this.errorBanner.textContent = message;
      this.errorBanner.style.display = 'block';
    } else {
      this.errorBanner.style.display = 'none';
    }
  }

  async checkAuthStatus() {
    const token = await this.client.getAccessToken();
    if (token) {
      if (this.client.ssoMode === 'prompt') {
        // Fetch active sessions to see if this app is already accessed
        const sessionsData = await this.client.getSessions().catch(() => ({ sessions: [] }));
        const currentSession = sessionsData.sessions[0];
        const isAccessed = currentSession && currentSession.appAccesses && currentSession.appAccesses.some(a => a.appClient.name === this.appName);
        
        if (currentSession && !isAccessed && currentSession.loginClient?.name !== this.appName) {
          const profileData = await this.client.getProfile().catch(() => ({ user: {} }));
          this.showSsoPrompt(profileData.user);
          return;
        }
      }

      this.showDashboard();
      this.onAuthSuccess(this.client);
    } else {
      this.showAuthForm();
    }
  }

  showSsoPrompt(user) {
    if (this.authView) this.authView.style.display = 'none';
    if (this.dashboardView) this.dashboardView.style.display = 'none';
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.style.display = 'none';

    let ssoView = document.getElementById('sso-prompt-view');
    if (!ssoView) {
      ssoView = document.createElement('div');
      ssoView.id = 'sso-prompt-view';
      document.querySelector('.main-container').appendChild(ssoView);
    }

    ssoView.style.display = 'block';
    const displayName = user.username || user.email || 'User';
    ssoView.innerHTML = `
      <div class="auth-panel" style="max-width: 450px; margin: 4rem auto; animation: floatUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;">
        <h2>🔐 KavachID SSO</h2>
        <p>You are already signed in to KavachID.</p>
        <div class="card" style="margin: 1.5rem 0; text-align: left; background: rgba(0,0,0,0.4);">
          <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
          <p><strong>Username:</strong> ${user.username || 'N/A'}</p>
        </div>
        <p style="margin-bottom: 1.5rem; color: var(--text-main);">Continue to <strong>${this.appName}</strong> as ${displayName}?</p>
        <button id="sso-continue-btn" class="btn btn-full">Continue as ${displayName}</button>
        <button id="sso-switch-btn" class="btn btn-secondary btn-full" style="margin-top: 1rem;">Switch Account</button>
      </div>
    `;

    document.getElementById('sso-continue-btn').addEventListener('click', async () => {
      ssoView.style.display = 'none';
      await this.client.recordSsoConsent();
      this.showDashboard();
      this.onAuthSuccess(this.client);
    });

    document.getElementById('sso-switch-btn').addEventListener('click', async () => {
      ssoView.style.display = 'none';
      try {
        await this.client.logout();
      } catch (err) {}
      this.showAuthForm();
    });
  }

  async showDashboard() {
    if (this.authView) this.authView.style.display = 'none';
    if (this.dashboardView) {
      this.dashboardView.style.display = 'block';
      await this.renderProfileAndSecurity();
    }
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
  }

  async renderProfileAndSecurity() {
    try {
      // Fetch data
      const [profileData, sessionsData, devicesData] = await Promise.all([
        this.client.getProfile().catch(() => ({ user: {} })),
        this.client.getSessions().catch(() => ({ sessions: [] })),
        this.client.getDevices().catch(() => ({ devices: [] }))
      ]);

      const user = profileData.user || {};
      const sessions = sessionsData.sessions || [];
      const devices = devicesData.devices || [];

      // Find or create the profile container
      let container = document.getElementById('kavach-security-profile');
      if (!container) {
        container = document.createElement('div');
        container.id = 'kavach-security-profile';
        container.className = 'security-profile-container';
        this.dashboardView.appendChild(container);
      }

      container.innerHTML = `
        <div class="profile-card">
          <h3>👤 User Profile</h3>
          <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
          <p><strong>Username:</strong> ${user.username || 'N/A'}</p>
          <p><strong>User ID:</strong> <span class="mono">${user.id || 'N/A'}</span></p>
          <div style="margin-top: 1rem;">
            <button id="register-passkey-btn" class="btn btn-secondary btn-small">➕ Register New Passkey (FaceID/TouchID)</button>
          </div>
        </div>

        <div class="security-grid">
          <div class="security-card">
            <h3>📱 Trusted Devices (${devices.length})</h3>
            <ul class="device-list">
              ${devices.map(d => `
                <li>
                  <strong>${d.platform || 'Unknown Device'}</strong>
                  <br>Seen: ${new Date(d.lastSeenAt).toLocaleString()}
                </li>
              `).join('') || '<li>No devices found</li>'}
            </ul>
          </div>

          <div class="security-card">
            <h3>🌐 Active Sessions (${sessions.length})</h3>
            <ul class="session-list">
              ${sessions.map(s => `
                <li>
                  <strong>IP:</strong> ${s.ipAddress}
                  <br><strong>Agent:</strong> ${s.userAgent || 'Unknown'}
                  <br><strong>Origin Product:</strong> ${s.loginClient?.name || 'Unknown'}
                  <br><strong>Products Accessed:</strong> ${s.appAccesses && s.appAccesses.length > 0 ? s.appAccesses.map(a => `<span class="badge" style="background: rgba(16, 185, 129, 0.1); color: var(--success-color); border: 1px solid rgba(16, 185, 129, 0.3); margin-right: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem;">${a.appClient.name}</span>`).join('') : 'None additional'}
                  <br>Seen: ${new Date(s.lastSeenAt).toLocaleString()}
                  <br><button class="btn btn-small btn-danger" onclick="window.kavachAuth.revokeSession('${s.id}')">Revoke Session</button>
                </li>
              `).join('') || '<li>No active sessions</li>'}
            </ul>
            <div style="margin-top: 15px;">
              <button id="logout-all-btn" class="btn btn-full btn-danger">Log Out of ALL Devices</button>
            </div>
          </div>
        </div>
      `;

      // Expose to window for the inline onclick handler
      window.kavachAuth = this;

      document.getElementById('logout-all-btn')?.addEventListener('click', async () => {
        if (confirm('Are you sure you want to log out of ALL devices and sessions?')) {
          await this.client.logoutAll();
          window.location.reload();
        }
      });

      document.getElementById('register-passkey-btn')?.addEventListener('click', async () => {
        try {
          await this.client.registerPasskey();
          alert('Passkey successfully registered! You can now log in without a password.');
        } catch (err) {
          alert('Failed to register passkey: ' + err.message);
        }
      });

    } catch (err) {
      console.error('Failed to render profile & security', err);
    }
  }

  async revokeSession(sessionId) {
    try {
      await this.client.revokeSession(sessionId);
      await this.renderProfileAndSecurity(); // refresh UI
    } catch (err) {
      alert('Failed to revoke session: ' + err.message);
    }
  }

  showAuthForm() {
    if (this.authView) this.authView.style.display = 'block';
    if (this.dashboardView) {
      this.dashboardView.style.display = 'none';
      const container = document.getElementById('kavach-security-profile');
      if (container) container.remove();
    }
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
}
