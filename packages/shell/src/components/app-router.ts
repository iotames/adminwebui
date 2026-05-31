import { parseComponentUrl, menuStore } from '@admerp/shared';
import type { RouteConfig } from '@admerp/shared';

export class AppRouter extends HTMLElement {
  private outlet: HTMLElement | null = null;
  private currentCleanup: (() => void) | null = null;
  private unsubStore: (() => void) | null = null;
  private boundPopstate: (() => void) | null = null;

  connectedCallback() {
    this.innerHTML = `<div id="outlet"></div>`;
    this.outlet = this.querySelector('#outlet')!;

    this.boundPopstate = () => this.resolveRoute();
    window.addEventListener('popstate', this.boundPopstate);

    this.unsubStore = menuStore.subscribe((state) => {
      if (state.routes.length > 0) {
        this.resolveRoute();
      }
    });

    this.resolveRoute();
  }

  disconnectedCallback() {
    if (this.boundPopstate) {
      window.removeEventListener('popstate', this.boundPopstate);
    }
    if (this.unsubStore) {
      this.unsubStore();
    }
  }

  resolveRoute() {
    let path = location.pathname;
    const routes = menuStore.getState().routes;

    if (routes.length === 0) {
      this.renderLoading();
      return;
    }

    if (path === '/' || path === '') {
      const first = routes.find(r => r.auth !== false);
      if (first) {
        history.replaceState(null, '', first.path);
        path = first.path;
      }
    }

    const route = this.matchRoute(path, routes);
    if (!route) {
      this.renderNotFound();
      return;
    }
    this.renderRoute(route);
  }

  renderLoading() {
    this.outlet!.innerHTML = `
      <div style="text-align:center;padding:80px 20px;color:#999;">
        <p style="font-size:16px;">加载中...</p>
      </div>
    `;
  }

  matchRoute(path: string, routes: RouteConfig[]): RouteConfig | undefined {
    return routes.find(r => r.path === path);
  }

  async renderRoute(route: RouteConfig) {
    if (this.currentCleanup) {
      this.currentCleanup();
      this.currentCleanup = null;
    }

    this.outlet!.innerHTML = '';

    const { type, name } = parseComponentUrl(route.component);

    if (type === 'amis') {
      const el = document.createElement('amis-schema');
      el.setAttribute('api', `/api/system/component?name=${name}`);
      el.setAttribute('title', route.title);
      this.outlet!.appendChild(el);
      this.currentCleanup = () => el.remove();
    } else {
      const tag = name;
      if (customElements.get(tag)) {
        const el = document.createElement(tag);
        this.outlet!.appendChild(el);
        this.currentCleanup = () => el.remove();
      } else {
        this.outlet!.textContent = `组件 ${tag} 未注册`;
      }
    }

    document.title = `${route.title} · Admerp`;
    const layout = this.closest('app-layout');
    if (layout && 'updateTitle' in layout) {
      (layout as any).updateTitle(route.title);
    }
  }

  renderNotFound() {
    this.outlet!.innerHTML = `
      <div style="text-align:center;padding:80px 20px;color:#999;">
        <h2 style="font-size:48px;margin:0;color:#d9d9d9;">404</h2>
        <p style="font-size:16px;">页面不存在</p>
      </div>
    `;
  }

  navigate(path: string) {
    history.pushState(null, '', path);
    this.resolveRoute();
  }
}

customElements.define('app-router', AppRouter);
