import puppeteer from 'puppeteer';
const BASE = 'http://localhost:3000';

const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || undefined,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--headless=new'],
  env: { ...process.env, LD_LIBRARY_PATH: '/tmp/chrome-libs/usr/lib/x86_64-linux-gnu' },
});

const page = await browser.newPage();
page.setDefaultTimeout(30000);
page.on('pageerror', err => console.log('PAGE_ERROR:', err.message));
page.on('console', msg => {
  const t = msg.type();
  if (t === 'error' || t === 'warning') console.log(`[${t}]`, msg.text());
});

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Login
await page.goto(BASE).catch(() => {});
await sleep(5000);

await page.evaluate(() => {
  const sr = document.querySelector('app-shell')?.shadowRoot;
  const login = sr?.querySelector('login-page');
  const root = login?.shadowRoot || login;
  const u = root?.querySelector('input[type="text"]');
  const p = root?.querySelector('input[type="password"]');
  const btn = root?.querySelector('button[type="submit"]');
  if (u) u.value = 'admin';
  if (p) p.value = 'admin123';
  if (btn) btn.click();
});
await sleep(8000);

// Navigate to /dept
await page.goto(`${BASE}/dept`).catch(() => {});
await sleep(5000);

// Deep debug: check amis-schema state, test embed
const info = await page.evaluate(async () => {
  const sr = document.querySelector('app-shell')?.shadowRoot;
  const layout = sr?.querySelector('app-layout');
  const router = layout?.querySelector('app-router');
  const outlet = router?.querySelector('#outlet');
  const amis = outlet?.querySelector('amis-schema');
  const container = amis?.querySelector('#container');

  if (!amis) return { error: 'no amis-schema' };
  if (!container) return { error: 'no container' };
  
  // Fetch the schema directly
  let schema = null, fetchOK = false;
  try {
    const r = await fetch('/api/system/component?name=dept-manage');
    schema = await r.json();
    fetchOK = true;
  } catch(e) { schema = e.message; }

  // Check AMIS utils
  const hasAmisRequire = typeof window.amisRequire === 'function';
  let amisEmbed = null;
  try { amisEmbed = window.amisRequire('amis/embed'); } catch(e) {}
  const hasEmbedFunc = typeof amisEmbed?.embed === 'function';

  // Try manual embed
  let embedResult = 'not tried';
  if (hasEmbedFunc && fetchOK && container) {
    try {
      const inst = amisEmbed.embed(container, schema, null, { theme: 'default' });
      await new Promise(r => setTimeout(r, 2000));
      embedResult = {
        children: container.children.length,
        html: container.innerHTML.replace(/</g,'<').slice(0, 300),
      };
    } catch(e) {
      embedResult = 'embed error: ' + e.message;
    }
  }

  return {
    fetchOK,
    schemaType: schema?.type,
    schemaTitle: schema?.title,
    hasAmisRequire,
    hasEmbedFunc,
    containerBefore: container.innerHTML.replace(/</g,'<').slice(0, 200) || '(empty)',
    embedResult,
  };
});
console.log(JSON.stringify(info, null, 2));

await browser.close();
