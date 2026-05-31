import { authStore } from '@admerp/shared';

const STYLE = document.createElement('style');
STYLE.textContent = `
.al-shell { display: flex; height: 100vh; }
.al-sidebar { width: 220px; min-width: 220px; background: #fff; border-right: 1px solid #f0f0f0; display: flex; flex-direction: column; }
.al-logo { padding: 16px 20px; font-size: 16px; font-weight: 600; color: #1890ff; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; gap: 8px; height: 56px; }
.al-logo-icon { font-size: 20px; }
.al-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.al-header { height: 48px; min-height: 48px; background: #fff; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; font-size: 14px; }
.al-header-title { font-weight: 500; color: #333; }
.al-header-actions { display: flex; align-items: center; gap: 12px; }
.al-user-info { color: #666; font-size: 13px; display: flex; align-items: center; gap: 6px; }
.al-logout-btn { background: none; border: 1px solid #d9d9d9; border-radius: 4px; padding: 4px 12px; font-size: 12px; cursor: pointer; color: #666; font-family: inherit; }
.al-logout-btn:hover { color: #1890ff; border-color: #1890ff; }
.al-content { flex: 1; overflow-y: auto; background: #f5f5f5; padding: 16px; }
.al-menu-wrap { flex: 1; overflow-y: auto; }
.al-footer { padding: 12px 20px; border-top: 1px solid #f0f0f0; font-size: 12px; color: #bbb; text-align: center; }
`;

export class AppLayout extends HTMLElement {
  connectedCallback() {
    this.appendChild(STYLE.cloneNode(true));
    this.render();
    this.setupListeners();
    this.updateUserInfo();
  }

  disconnectedCallback() {
    if (this._logoutHandler) {
      this.#logoutBtn?.removeEventListener('click', this._logoutHandler);
    }
  }

  get #logoutBtn() {
    return this.querySelector<HTMLButtonElement>('#logoutBtn');
  }

  private _logoutHandler?: () => void;

  render() {
    this.innerHTML += `
      <div class="al-shell">
        <aside class="al-sidebar">
          <div class="al-logo">
            <span class="al-logo-icon">◆</span>
            <span>Admerp 中台</span>
          </div>
          <div class="al-menu-wrap"><app-menu></app-menu></div>
          <div class="al-footer">v0.1 · 模拟环境</div>
        </aside>
        <div class="al-main">
          <header class="al-header">
            <span class="al-header-title" id="pageTitle">欢迎</span>
            <div class="al-header-actions">
              <span class="al-user-info"><span id="userDisplay">未登录</span></span>
              <button class="al-logout-btn" id="logoutBtn">退出</button>
            </div>
          </header>
          <main class="al-content"><app-router></app-router></main>
        </div>
      </div>
    `;
  }

  updateUserInfo() {
    const { user } = authStore.getState();
    if (user) {
      this.updateUserDisplay(user.nickname);
    }
  }

  setupListeners() {
    const btn = this.#logoutBtn;
    if (btn) {
      this._logoutHandler = () => {
        authStore.getState().logout();
        location.reload();
      };
      btn.addEventListener('click', this._logoutHandler);
    }
  }

  updateUserDisplay(nickname: string) {
    const el = this.querySelector('#userDisplay');
    if (el) el.textContent = nickname || '未登录';
  }

  updateTitle(title: string) {
    const el = this.querySelector('#pageTitle');
    if (el) el.textContent = title;
  }
}

customElements.define('app-layout', AppLayout);
