import { auth } from '../state/auth';

export class AuthViewUI {
  private container: HTMLElement;
  private activeTab: 'signin' | 'signup' = 'signin';
  private errorMsg: string = '';

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  public open(tab: 'signin' | 'signup' = 'signin') {
    this.activeTab = tab;
    this.errorMsg = '';
    this.render();
    const modal = this.container.querySelector('#auth-modal') as HTMLElement;
    if (modal) {
      modal.classList.add('open');
      const firstInput = modal.querySelector('input') as HTMLInputElement;
      if (firstInput) firstInput.focus();
    }
  }

  public close() {
    const modal = this.container.querySelector('#auth-modal') as HTMLElement;
    if (modal) modal.classList.remove('open');
  }

  private render() {
    this.container.innerHTML = `
      <div class="auth-overlay glass-panel" id="auth-modal">
        <div class="auth-card">
          <div style="text-align: center; margin-bottom: 24px;">
            <div class="brand-title" style="font-size: 24px; letter-spacing: 0.3em;">ORBIT</div>
            <div class="hud-readout" style="margin-top: 4px;">PERSONAL RELATIONSHIP NETWORK VAULT</div>
          </div>

          <!-- Tab Selector -->
          <div style="display: flex; gap: 12px; margin-bottom: 24px; border-bottom: 1px solid rgba(255, 61, 85, 0.2); padding-bottom: 10px;">
            <button type="button" class="btn-text ${this.activeTab === 'signin' ? 'active-tab' : ''}" id="tab-signin-btn" style="flex: 1; text-align: center;">
              [SIGN IN]
            </button>
            <button type="button" class="btn-text ${this.activeTab === 'signup' ? 'active-tab' : ''}" id="tab-signup-btn" style="flex: 1; text-align: center;">
              [CREATE ACCOUNT]
            </button>
          </div>

          ${this.errorMsg ? `<div class="auth-error-banner">${this.errorMsg.toUpperCase()}</div>` : ''}

          <!-- Sign In Form -->
          ${
            this.activeTab === 'signin'
              ? `
            <form id="signin-form">
              <div class="form-group">
                <label class="form-label">USERNAME OR EMAIL</label>
                <input type="text" class="form-input" id="auth-id" placeholder="e.g. alex or alex@example.com" required autofocus />
              </div>
              <div class="form-group">
                <label class="form-label">PASSWORD</label>
                <input type="password" class="form-input" id="auth-pass" placeholder="••••••••" required />
              </div>
              <div style="margin-top: 28px;">
                <button type="submit" class="btn-rect btn-primary" style="width: 100%; justify-content: center; padding: 12px;">
                  SIGN IN TO ORBIT →
                </button>
              </div>
            </form>
          `
              : `
            <!-- Sign Up Form -->
            <form id="signup-form">
              <div class="form-group">
                <label class="form-label">USERNAME</label>
                <input type="text" class="form-input" id="signup-user" placeholder="e.g. Ayla" required autofocus />
              </div>
              <div class="form-group">
                <label class="form-label">EMAIL ADDRESS</label>
                <input type="email" class="form-input" id="signup-email" placeholder="e.g. ayla@example.com" required />
              </div>
              <div class="form-group">
                <label class="form-label">PASSWORD</label>
                <input type="password" class="form-input" id="signup-pass" placeholder="At least 4 characters" required />
              </div>
              <div style="margin-top: 28px;">
                <button type="submit" class="btn-rect btn-primary" style="width: 100%; justify-content: center; padding: 12px;">
                  CREATE ACCOUNT & INITIALIZE ORBIT →
                </button>
              </div>
            </form>
          `
          }
        </div>
      </div>
    `;

    this.attachEvents();
  }

  private attachEvents() {
    const modal = this.container.querySelector('#auth-modal') as HTMLElement;
    if (!modal) return;

    // Tab buttons
    modal.querySelector('#tab-signin-btn')?.addEventListener('click', () => {
      this.activeTab = 'signin';
      this.errorMsg = '';
      this.render();
      modal.classList.add('open');
    });

    modal.querySelector('#tab-signup-btn')?.addEventListener('click', () => {
      this.activeTab = 'signup';
      this.errorMsg = '';
      this.render();
      modal.classList.add('open');
    });

    // Sign In Form
    const signinForm = modal.querySelector('#signin-form') as HTMLFormElement;
    signinForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const idInput = modal.querySelector('#auth-id') as HTMLInputElement;
      const passInput = modal.querySelector('#auth-pass') as HTMLInputElement;

      const res = auth.signIn(idInput.value, passInput.value);
      if (res.success) {
        this.close();
      } else {
        this.errorMsg = res.error || 'Authentication failed';
        this.render();
        modal.classList.add('open');
      }
    });

    // Sign Up Form
    const signupForm = modal.querySelector('#signup-form') as HTMLFormElement;
    signupForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const userInput = modal.querySelector('#signup-user') as HTMLInputElement;
      const emailInput = modal.querySelector('#signup-email') as HTMLInputElement;
      const passInput = modal.querySelector('#signup-pass') as HTMLInputElement;

      const res = auth.signUp(userInput.value, emailInput.value, passInput.value);
      if (res.success) {
        this.close();
      } else {
        this.errorMsg = res.error || 'Registration failed';
        this.render();
        modal.classList.add('open');
      }
    });
  }
}
