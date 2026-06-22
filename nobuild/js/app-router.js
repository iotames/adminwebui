import { parseComponentUrl, menuStore } from './store.js';

class AppRouter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = '<div id="outlet"></div>';
    this.outlet = this.querySelector('#outlet');

    this._boundPopstate = () => this.resolveRoute();
    window.addEventListener('popstate', this._boundPopstate);

    this._unsubStore = menuStore.subscribe((state) => {
      if (state.routes.length > 0) this.resolveRoute();
    });

    this.resolveRoute();
  }

  disconnectedCallback() {
    if (this._boundPopstate) window.removeEventListener('popstate', this._boundPopstate);
    if (this._unsubStore) this._unsubStore();
  }

  resolveRoute() {
    let path = location.pathname;
    const routes = menuStore.getState().routes;
    if (routes.length === 0) { this.renderLoading(); return; }

    if (path === '/' || path === '') {
      const first = routes.find(r => r.auth !== false);
      if (first) { history.replaceState(null, '', first.path); path = first.path; }
    }

    const route = this.matchRoute(path, routes);
    if (!route) { this.renderNotFound(); return; }
    this.renderRoute(route);
  }

  renderLoading() {
    this.outlet.innerHTML = '<div style="text-align:center;padding:80px 20px;color:#999;"><p style="font-size:16px;">加载中...</p></div>';
  }

  matchRoute(path, routes) {
    return routes.find(r => r.path === path);
  }

  async renderRoute(route) {
    if (this._currentCleanup) { this._currentCleanup(); this._currentCleanup = null; }
    this.outlet.innerHTML = '';
    const { type, name } = parseComponentUrl(route.component);

    if (type === 'amis') {
      const el = document.createElement('amis-schema');
      el.setAttribute('api', `/api/system/component?name=${name}`);
      el.setAttribute('title', route.title);
      this.outlet.appendChild(el);
      this._currentCleanup = () => el.remove();
    } else {
      const tag = name;
      if (customElements.get(tag)) {
        const el = document.createElement(tag);
        this.outlet.appendChild(el);
        this._currentCleanup = () => el.remove();
      } else {
        this.outlet.textContent = `组件 ${tag} 未注册`;
      }
    }

    document.title = `${route.title} · Admerp`;
    const layout = this.closest('app-layout');
    if (layout && layout.updateTitle) layout.updateTitle(route.title);
  }

  renderNotFound() {
    this.outlet.innerHTML = '<div style="text-align:center;padding:80px 20px;color:#999;"><h2 style="font-size:48px;margin:0;color:#d9d9d9;">404</h2><p style="font-size:16px;">页面不存在</p></div>';
  }

  navigate(path) {
    history.pushState(null, '', path);
    this.resolveRoute();
  }
}

customElements.define('app-router', AppRouter);
