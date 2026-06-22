import { post } from './api-client.js';
import { authStore } from './store.js';

class LoginPage extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.render();
    this.bindEvents();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex; align-items: center; justify-content: center;
          height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .card { background: #fff; border-radius: 8px; padding: 40px; width: 360px; box-shadow: 0 8px 32px rgba(0,0,0,.15); }
        .title { text-align: center; font-size: 24px; font-weight: 600; color: #333; margin: 0 0 8px; }
        .subtitle { text-align: center; font-size: 14px; color: #999; margin: 0 0 32px; }
        .field { margin-bottom: 20px; }
        .field label { display: block; font-size: 13px; color: #666; margin-bottom: 6px; font-weight: 500; }
        .field input {
          width: 100%; padding: 10px 12px; font-size: 14px;
          border: 1px solid #d9d9d9; border-radius: 4px;
          outline: none; transition: border-color .2s; box-sizing: border-box;
          font-family: inherit;
        }
        .field input:focus { border-color: #1890ff; box-shadow: 0 0 0 2px rgba(24,144,255,.1); }
        .error { color: #f5222d; font-size: 13px; margin-bottom: 16px; min-height: 20px; display: none; }
        .error.visible { display: block; }
        .submit {
          width: 100%; padding: 10px; font-size: 15px;
          background: #1890ff; color: #fff;
          border: none; border-radius: 4px; cursor: pointer;
          font-weight: 500; transition: opacity .2s; font-family: inherit;
        }
        .submit:hover { opacity: .9; }
        .submit:disabled { opacity: .5; cursor: not-allowed; }
        .hint { text-align: center; margin-top: 24px; font-size: 12px; color: #bbb; }
      </style>
      <div class="card">
        <h1 class="title">Admerp 中台</h1>
        <p class="subtitle">企业管理后台</p>
        <form id="loginForm">
          <div class="field">
            <label for="username">用户名</label>
            <input type="text" id="username" placeholder="请输入用户名" autocomplete="username" required />
          </div>
          <div class="field">
            <label for="password">密码</label>
            <input type="password" id="password" placeholder="请输入密码" autocomplete="current-password" required />
          </div>
          <div class="error" id="errorMsg"></div>
          <button type="submit" class="submit" id="submitBtn">登 录</button>
        </form>
        <div class="hint">演示环境 · 任意用户名密码即可登录</div>
      </div>`;

    this.formEl = this.shadowRoot.getElementById('loginForm');
    this.usernameEl = this.shadowRoot.getElementById('username');
    this.passwordEl = this.shadowRoot.getElementById('password');
    this.errorEl = this.shadowRoot.getElementById('errorMsg');
    this.submitBtn = this.shadowRoot.getElementById('submitBtn');
  }

  bindEvents() {
    this.formEl.addEventListener('submit', (e) => { e.preventDefault(); this.handleLogin(); });
  }

  async handleLogin() {
    const username = this.usernameEl.value.trim();
    const password = this.passwordEl.value.trim();
    if (!username || !password) { this.showError('请输入用户名和密码'); return; }

    this.submitBtn.disabled = true;
    this.submitBtn.textContent = '登录中...';
    this.hideError();

    try {
      const res = await post('/api/auth/login', { username, password });
      authStore.getState().setAuth(res.data.token, res.data.user);
      this.dispatchEvent(new CustomEvent('login-success', { bubbles: true, composed: true }));
      location.reload();
    } catch (err) {
      this.showError(err.message || '登录失败，请重试');
    } finally {
      this.submitBtn.disabled = false;
      this.submitBtn.textContent = '登 录';
    }
  }

  showError(msg) { this.errorEl.textContent = msg; this.errorEl.classList.add('visible'); }
  hideError() { this.errorEl.textContent = ''; this.errorEl.classList.remove('visible'); }
}

customElements.define('login-page', LoginPage);
