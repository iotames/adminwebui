import puppeteer from 'puppeteer';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT = path.resolve(__dirname, '../verify-output');
const BASE = 'http://127.0.0.1:3000';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

if (!existsSync(OUTPUT)) mkdirSync(OUTPUT, { recursive: true });

let shotIdx = 0;
async function shot(page, label) {
  shotIdx++;
  const name = `${String(shotIdx).padStart(2, '0')}-${label}`;
  try {
    await page.screenshot({ path: path.join(OUTPUT, `${name}.png`), fullPage: true });
    console.log(`  \u2713 screenshot: ${name}.png`);
  } catch (e) {
    console.log(`  \u26a0 screenshot ${name} failed: ${e.message}`);
  }
}

async function newPage(browser) {
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);
  page.on('pageerror', err => console.log(`  [browser error] ${err.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`  [console.error] ${msg.text()}`);
  });
  await page.setViewport({ width: 1440, height: 900 });
  return page;
}

// Query elements (only descendant shadow DOM boundaries via known shadow hosts)
async function qsShadow(page, selectors) {
  return page.evaluate((sels) => {
    let el = document;
    for (const sel of sels) {
      el = el.querySelector(sel);
      if (!el) return null;
      if (el.shadowRoot && !sel.startsWith('.') && !sel.startsWith('#')) el = el.shadowRoot;
    }
    return el ? true : false;
  }, selectors);
}

async function getTextShadow(page, selectors) {
  return page.evaluate((sels) => {
    let el = document;
    for (const sel of sels) {
      el = el.querySelector(sel);
      if (!el) return null;
      if (el.shadowRoot && !sel.startsWith('.') && !sel.startsWith('#')) el = el.shadowRoot;
    }
    return el?.textContent?.trim() || null;
  }, selectors);
}

async function main() {
  console.log('Starting Puppeteer test...\n');

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--headless=new'],
    env: { ...process.env, LD_LIBRARY_PATH: '/tmp/chrome-libs/usr/lib/x86_64-linux-gnu' },
  });

  try {
    // ── 1. Login page ──
    console.log('[1] Login page...');
    let page = await newPage(browser);
    await page.goto(BASE);
    await sleep(4000);
    await shot(page, '01-login');

    const loginExists = await page.evaluate(() => !!document.querySelector('login-page'));
    console.log(`  login-page rendered: ${loginExists}\n`);
    await page.close();

    // ── 2. Login flow (stay on same page) ──
    console.log('[2] Executing login...');
    page = await newPage(browser);
    await page.goto(BASE);
    await sleep(4000);

    await page.evaluate(() => {
      const login = document.querySelector('login-page');
      if (!login) return;
      const root = login.shadowRoot;
      if (!root) return;
      const u = root.querySelector('input[type="text"]');
      const p = root.querySelector('input[type="password"]');
      const btn = root.querySelector('button[type="submit"]');
      if (u) u.value = 'admin';
      if (p) p.value = 'admin123';
      if (btn) btn.click();
    });

    // Wait for login success → location.reload() → MSW restart → layout render
    await sleep(6000);
    await shot(page, '02-after-login');

    // Check if layout rendered
    const hasLayout = await page.evaluate(() => !!document.querySelector('app-layout'));
    console.log(`  app-layout rendered: ${hasLayout}`);

    // Verify user info is displayed
    const userDisplay = await page.evaluate(() => document.querySelector('#userDisplay')?.textContent?.trim() || null);
    console.log(`  user display: ${userDisplay}`);

    const pageTitle = await page.evaluate(() => document.querySelector('#pageTitle')?.textContent?.trim() || null);
    console.log(`  page title: ${pageTitle}\n`);

    // ── 3. Navigate to Department management ──
    console.log('[3] Navigate to /dept via menu...');
    await page.evaluate(() => {
      const menu = document.querySelector('app-menu');
      const mRoot = menu?.shadowRoot;
      if (!mRoot) return;
      const deptBtn = Array.from(mRoot.querySelectorAll('.menu-link')).find(
        el => el.textContent?.includes('部门管理')
      );
      if (deptBtn) deptBtn.click();
    });
    await sleep(5000);
    await shot(page, '03-dept-manage');

    // Check dept page content
    const deptInfo = await page.evaluate(() => {
      const router = document.querySelector('app-router');
      const outlet = router?.querySelector('#outlet');
      const amisEl = outlet?.querySelector('amis-schema');
      const container = amisEl?.querySelector('#container');
      const title = document.querySelector('#pageTitle')?.textContent;
      return {
        routerExists: !!router,
        outletHTML: outlet?.innerHTML?.slice(0, 300) || '(none)',
        amisExists: !!amisEl,
        containerChildCount: container?.children?.length || 0,
        containerText: container?.textContent?.slice(0, 300) || '(none)',
        pageTitle: title,
      };
    });
    console.log(`  ${JSON.stringify(deptInfo, null, 2)}`);

    // Wait a bit more for AMIS to fully render the CRUD
    await sleep(3000);
    await shot(page, '03-dept-manage-2');

    // Check again after more time
    const deptInfo2 = await page.evaluate(() => {
      const container = document.querySelector('#outlet amis-schema #container');
      return {
        containerChildren: container?.children?.length || 0,
        containerHTML: container?.innerHTML?.slice(0, 500) || '(none)',
      };
    });
    console.log(`  dept recheck: ${JSON.stringify(deptInfo2, null, 2)}`);

    // ── 4. Navigate to User management ──
    console.log('\n[4] Navigate to /user via menu...');
    await page.evaluate(() => {
      const menu = document.querySelector('app-menu');
      const mRoot = menu?.shadowRoot;
      if (!mRoot) return;
      const userBtn = Array.from(mRoot.querySelectorAll('.menu-link')).find(
        el => el.textContent?.includes('用户管理')
      );
      if (userBtn) userBtn.click();
    });
    await sleep(5000);
    await shot(page, '04-user-manage');

    const userInfo = await page.evaluate(() => {
      const container = document.querySelector('#outlet amis-schema #container');
      const title = document.querySelector('#pageTitle')?.textContent;
      return {
        containerChildren: container?.children?.length || 0,
        containerHTML: container?.innerHTML?.slice(0, 500) || '(none)',
        pageTitle: title,
      };
    });
    console.log(`  ${JSON.stringify(userInfo, null, 2)}`);
    await sleep(3000);
    await shot(page, '04-user-manage-2');

    // ── 5. In-browser MSW API verification ──
    console.log('\n[5] API verification (in-browser via MSW)...');
    const apiResults = await page.evaluate(async () => {
      async function jf(url, opts) {
        const r = await fetch(url, opts);
        return { status: r.status, body: await r.json().catch(() => null) };
      }
      const results = [];
      try {
        const menu = await jf('/api/system/menu');
        results.push(`GET /api/system/menu: ${menu.body?.length || menu.status} items`);
      } catch(e) { results.push(`GET /api/system/menu: FAIL ${e.message}`); }
      try {
        const route = await jf('/api/system/route');
        results.push(`GET /api/system/route: ${route.body?.length || route.status} routes`);
      } catch(e) { results.push(`GET /api/system/route: FAIL ${e.message}`); }
      try {
        const dept = await jf('/api/dept');
        results.push(`GET /api/dept: ${dept.body?.data?.items?.length || dept.status} items`);
      } catch(e) { results.push(`GET /api/dept: FAIL ${e.message}`); }
      try {
        const user = await jf('/api/user');
        results.push(`GET /api/user: ${user.body?.data?.items?.length || user.status} items`);
      } catch(e) { results.push(`GET /api/user: FAIL ${e.message}`); }
      try {
        const login = await jf('/api/auth/login', { method:'POST', body: JSON.stringify({username:'t',password:'t'}), headers:{'Content-Type':'application/json'} });
        results.push(`POST /api/auth/login: ${login.body?.token?.slice(0,12)||'fail'} (auth)`);
      } catch(e) { results.push(`POST /api/auth/login: FAIL ${e.message}`); }
      try {
        const schema = await jf('/api/system/component?name=dept-manage');
        results.push(`GET amis schema: type=${schema.body?.type||'fail'} (dept-manage)`);
      } catch(e) { results.push(`GET amis schema: FAIL ${e.message}`); }
      return results;
    });
    apiResults.forEach(r => console.log(`  ${r}`));

    console.log('\n\u2705 All checks complete');
    console.log(`Screenshots in: ${OUTPUT}/`);

  } catch (e) {
    console.error(`\n\u274c Fatal error: ${e.message}`);
  } finally {
    await browser.close();
  }
}

main();
