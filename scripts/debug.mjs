import puppeteer from 'puppeteer';

const BASE = 'http://localhost:3000';

async function main() {
const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || undefined,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--headless=new'],
  env: { ...process.env, LD_LIBRARY_PATH: '/tmp/chrome-libs/usr/lib/x86_64-linux-gnu' },
});

const page = await browser.newPage();
page.setDefaultTimeout(30000);

const logs = [];
page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', err => logs.push(`[ERROR] ${err.message}`));

await page.goto(BASE).catch(e => logs.push(`[goto error] ${e.message}`));
console.log('Page loaded, waiting 8s...');
await new Promise(r => setTimeout(r, 8000));

const info = await page.evaluate(() => {
  const shell = document.querySelector('app-shell');
  const shellShadow = shell?.shadowRoot;
  const loginWC = shellShadow?.querySelector('login-page');
  const loginShadow = loginWC?.shadowRoot;
  const layoutWC = shellShadow?.querySelector('app-layout');
  return {
    url: location.href,
    hasShell: !!shell,
    shellChildren: shellShadow?.children?.length || 0,
    shellContent: shellShadow?.innerHTML?.slice(0, 200) || '(none)',
    hasLoginWC: !!loginWC,
    loginForm: !!loginShadow?.querySelector('#loginForm'),
    loginBtn: !!loginShadow?.querySelector('button[type="submit"]'),
    hasLayout: !!layoutWC,
    bodyPreview: document.body.innerHTML.replace(/</g, '<').slice(0, 200),
  };
});

console.log(JSON.stringify(info, null, 2));
console.log('\n--- Browser logs ---');
logs.forEach(l => console.log(l));
await browser.close();
}
main();