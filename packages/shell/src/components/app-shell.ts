import { get, authStore, menuStore } from '@admerp/shared';
import type { MenuItem, RouteConfig } from '@admerp/shared';
import './app-layout';
import './app-menu';
import './app-router';
import './login-page';

export class AppShell extends HTMLElement {
  private boundNavigate: EventListener | null = null;

  connectedCallback() {
    this.checkAuthAndRender();
  }

  disconnectedCallback() {
    if (this.boundNavigate) {
      this.removeEventListener('navigate', this.boundNavigate);
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

    this.boundNavigate = ((e: CustomEvent) => {
      const router = this.querySelector('app-router') as any;
      if (router && router.navigate) {
        router.navigate(e.detail.path);
      }
    }) as EventListener;
    this.addEventListener('navigate', this.boundNavigate);
  }

  async loadSystemConfig() {
    try {
      const [menus, routes] = await Promise.all([
        get<MenuItem[]>('/api/system/menu'),
        get<RouteConfig[]>('/api/system/route'),
      ]);
      menuStore.getState().setMenus(menus);
      menuStore.getState().setRoutes(routes);
    } catch (e) {
      console.error('系统配置加载失败:', e);
    }
  }
}

customElements.define('app-shell', AppShell);
