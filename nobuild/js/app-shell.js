import { get } from './api-client.js';
import { authStore, menuStore } from './store.js';
import './app-layout.js';
import './app-menu.js';
import './app-router.js';
import './login-page.js';

class AppShell extends HTMLElement {
  connectedCallback() {
    this.checkAuthAndRender();
  }

  disconnectedCallback() {
    if (this._boundNavigate) {
      this.removeEventListener('navigate', this._boundNavigate);
    }
  }

  async checkAuthAndRender() {
    const { token } = authStore.getState();
    if (token) {
      this.renderApp();
      await this.loadSystemConfig();
    } else {
      this.renderLogin();
    }
  }

  renderLogin() {
    this.innerHTML = '<login-page></login-page>';
  }

  renderApp() {
    this.innerHTML = '<app-layout></app-layout>';
    this._boundNavigate = ((e) => {
      const router = this.querySelector('app-router');
      if (router && router.navigate) {
        router.navigate(e.detail.path);
      }
    });
    this.addEventListener('navigate', this._boundNavigate);
  }

  async loadSystemConfig() {
    try {
      const [menusRes, routesRes] = await Promise.all([
        get('/api/system/menu'),
        get('/api/system/route'),
      ]);
      menuStore.getState().setMenus(menusRes.data);
      menuStore.getState().setRoutes(routesRes.data);
    } catch (e) {
      console.error('系统配置加载失败:', e);
    }
  }
}

customElements.define('app-shell', AppShell);
