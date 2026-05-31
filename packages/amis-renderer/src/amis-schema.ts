export class AmisSchema extends HTMLElement {
  private container!: HTMLDivElement;
  private amisInstance: { unmount: () => void } | null = null;

  static get observedAttributes() {
    return ['api', 'schema'];
  }

  connectedCallback() {
    this.innerHTML = '<div id="container" style="min-height:200px;"></div>';
    this.container = this.querySelector('#container') as HTMLDivElement;
    this.render();
  }

  disconnectedCallback() {
    this.destroyAmis();
  }

  attributeChangedCallback() {
    if (this.isConnected) {
      this.render();
    }
  }

  async render() {
    this.destroyAmis();

    const api = this.getAttribute('api');
    const schemaAttr = this.getAttribute('schema');
    let schema: any;

    if (api) {
      try {
        const res = await fetch(api);
        schema = await res.json();
      } catch (e) {
        this.container.innerHTML = `<div style="color:#f5222d;padding:20px;">Schema 加载失败: ${api}</div>`;
        return;
      }
    } else if (schemaAttr) {
      try {
        schema = JSON.parse(schemaAttr);
      } catch {
        this.container.innerHTML = '<div style="color:#f5222d;padding:20px;">Schema JSON 解析失败</div>';
        return;
      }
    } else {
      this.container.innerHTML = '<div style="color:#999;padding:20px;">请指定 api 或 schema 属性</div>';
      return;
    }

    await this.embedAmis(schema);
  }

  async embedAmis(schema: any) {
    await this.waitForAmisSDK();
    if (!(window as any).amisRequire) {
      this.container.innerHTML = '<div style="color:#f5222d;padding:20px;">AMIS SDK 加载超时</div>';
      return;
    }

    try {
      const amis = (window as any).amisRequire('amis/embed');
      this.amisInstance = amis.embed(this.container, schema, {}, {
        theme: 'cxd',
        getModalContainer: () => document.body,
      });
    } catch (e: any) {
      this.container.innerHTML = `<div style="color:#f5222d;padding:20px;">AMIS 渲染失败: ${e.message}</div>`;
    }
  }

  waitForAmisSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).amisRequire) return resolve();
      let retries = 0;
      const maxRetries = 40;
      const check = () => {
        retries++;
        if ((window as any).amisRequire) return resolve();
        if (retries >= maxRetries) return reject(new Error('timeout'));
        setTimeout(check, 500);
      };
      check();
    });
  }

  destroyAmis() {
    if (this.amisInstance) {
      try { this.amisInstance.unmount(); } catch {}
      this.amisInstance = null;
    }
  }
}

customElements.define('amis-schema', AmisSchema);
