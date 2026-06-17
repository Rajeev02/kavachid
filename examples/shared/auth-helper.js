import { KavachClient } from '../../kavach-sdk/dist/index.js';

/**
 * Shared authentication wrapper logic for KavachID demo apps.
 */
export class KavachAuthHelper {
  constructor(config = {}) {
    this.serverUrl = config.serverUrl || 'http://localhost:3000';
    this.tenantId = config.tenantId || '123e4567-e89b-12d3-a456-426614174000';
    this.appName = config.appName || 'KavachID App';
    this.onAuthSuccess = config.onAuthSuccess || (() => {});
    
    this.client = new KavachClient({
      serverUrl: this.serverUrl,
      tenantId: this.tenantId
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
          <h2>🛡️ <span class="app-name">${this.appName}</span></h2>
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
          usernameGroup.style.display = 'flex';
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
        try {
          await this.client.logout();
        } catch (err) {
          console.warn('Logout failed', err);
        }
        setUserState(null);
        window.location.reload();
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
      this.showDashboard();
      this.onAuthSuccess(this.client);
    } else {
      this.showAuthForm();
    }
  }

  showDashboard() {
    if (this.authView) this.authView.style.display = 'none';
    if (this.dashboardView) this.dashboardView.style.display = 'block';
  }

  showAuthForm() {
    if (this.authView) this.authView.style.display = 'block';
    if (this.dashboardView) this.dashboardView.style.display = 'none';
  }
}
