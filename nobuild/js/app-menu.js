import { get } from './api-client.js';
import { menuStore } from './store.js';

class AppMenu extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.render();
    this.loadMenus();
    this._boundPopstate = () => this.highlightActive();
    window.addEventListener('popstate', this._boundPopstate);
  }

  disconnectedCallback() {
    if (this._boundPopstate) {
      window.removeEventListener('popstate', this._boundPopstate);
    }
  }

  async loadMenus() {
    try {
      const res = await get('/api/system/menu');
      this.menus = res.data;
      menuStore.getState().setMenus(this.menus);
      this.render();
    } catch (e) {
      console.error('菜单加载失败:', e);
    }
  }

  render() {
    const shadow = this.shadowRoot;
    const currentPath = location.pathname;
    this.menus = this.menus || [];
    shadow.innerHTML = `
      <style>
        :host { display: block; }
        .menu { list-style: none; margin: 0; padding: 0; }
        .menu-item { border-bottom: 1px solid #f5f5f5; }
        .menu-link {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 24px; color: #333;
          text-decoration: none; font-size: 14px;
          transition: background .15s; cursor: pointer;
          background: none; border: none; width: 100%;
          text-align: left; font-family: inherit;
        }
        .menu-link:hover { background: #e6f7ff; color: #1890ff; }
        .menu-link.active { background: #e6f7ff; color: #1890ff; font-weight: 500; }
        .menu-icon { width: 16px; text-align: center; font-size: 16px; }
        .sub-menu { list-style: none; margin: 0; padding: 0; overflow: hidden; max-height: 0; transition: max-height .2s; }
        .sub-menu.open { max-height: 500px; }
        .sub-menu .menu-link { padding-left: 48px; font-size: 13px; }
      </style>
      <ul class="menu" role="navigation">
        ${this.menus.map(m => this.renderMenuItem(m, currentPath)).join('')}
      </ul>`;

    shadow.querySelectorAll('.menu-link').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const parent = el.closest('li');
        const sub = parent?.querySelector('.sub-menu');
        if (sub) { sub.classList.toggle('open'); return; }
        const path = el.dataset.path || '';
        this.dispatchEvent(new CustomEvent('navigate', { detail: { path }, bubbles: true, composed: true }));
        this.highlightActive(path);
      });
    });
  }

  highlightActive(path) {
    const current = path || location.pathname;
    const shadow = this.shadowRoot;
    shadow.querySelectorAll('.menu-link').forEach(el => {
      el.classList.toggle('active', el.dataset.path === current);
    });
    shadow.querySelectorAll('.sub-menu').forEach(el => {
      const parent = el.closest('.menu-item');
      const hasActive = el.querySelector('.menu-link.active');
      el.classList.toggle('open', !!hasActive);
    });
  }

  renderMenuItem(m, currentPath) {
    const icon = m.icon ? `<span class="menu-icon">${m.icon}</span>` : '<span class="menu-icon">📄</span>';
    const hasChildren = m.children && m.children.length > 0;
    const isActive = m.path === currentPath;
    const childActive = hasChildren && m.children.some(c => c.path === currentPath);
    return `
      <li class="menu-item">
        <button class="menu-link${isActive ? ' active' : ''}" data-path="${m.path}" data-id="${m.id}">
          ${icon}<span>${m.title}</span>
        </button>
        ${hasChildren ? `<ul class="sub-menu${childActive ? ' open' : ''}">
          ${m.children.map(c => `<li><button class="menu-link${c.path === currentPath ? ' active' : ''}" data-path="${c.path}" data-id="${c.id}"><span>${c.title}</span></button></li>`).join('')}
        </ul>` : ''}
      </li>`;
  }
}

customElements.define('app-menu', AppMenu);
