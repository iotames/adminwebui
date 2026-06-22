// ── Mock router engine ──────────────────────────────────────────────
const routes = [];

function addRoute(method, pattern, handler) {
  const paramNames = [];
  const regexStr = pattern.replace(/:([^/]+)/g, (_, name) => { paramNames.push(name); return '([^/]+)'; });
  routes.push({ method: method.toUpperCase(), regex: new RegExp(`^${regexStr}$`), paramNames, handler });
}

async function dispatch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const urlObj = new URL(url, location.origin);
  const path = urlObj.pathname;
  for (const r of routes) {
    if (r.method !== method) continue;
    const m = path.match(r.regex);
    if (!m) continue;
    const params = {};
    r.paramNames.forEach((name, i) => { params[name] = m[i + 1]; });
    let body;
    try { body = options.body ? JSON.parse(options.body) : undefined; } catch {}
    return r.handler({ params, url: urlObj, body });
  }
  return null;
}

// ── Seed data ───────────────────────────────────────────────────────
const menus = [
  { id: '1', path: '/dashboard', title: '仪表盘', icon: '📊', children: [] },
  { id: '2', path: '/system', title: '系统管理', icon: '⚙️', children: [
    { id: '2-1', path: '/dept', title: '部门管理' },
    { id: '2-2', path: '/user', title: '用户管理' },
  ]},
  { id: '3', path: '/product', title: '商品管理', icon: '📦', children: [] },
  { id: '4', path: '/about', title: '关于', icon: 'ℹ️', children: [] },
];
const routesCfg = [
  { path: '/login', title: '登录', component: 'wc://login-page', auth: false },
  { path: '/dashboard', title: '仪表盘', component: 'amis://dashboard', auth: true },
  { path: '/dept', title: '部门管理', component: 'amis://dept-manage', auth: true },
  { path: '/user', title: '用户管理', component: 'amis://user-manage', auth: true },
  { path: '/product', title: '商品管理', component: 'amis://product-manage', auth: true },
  { path: '/about', title: '关于', component: 'amis://about', auth: true },
];

function paginate(items, urlObj) {
  const page = parseInt(urlObj.searchParams.get('page') || '1');
  const perPage = parseInt(urlObj.searchParams.get('perPage') || '10');
  const total = items.length;
  return { items: items.slice((page - 1) * perPage, page * perPage), total, count: items.slice((page - 1) * perPage, page * perPage).length, page, perPage };
}

const delay = ms => new Promise(r => setTimeout(r, ms));

// ── Auth ────────────────────────────────────────────────────────────
addRoute('POST', '/api/auth/login', async ({ body }) => {
  await delay(600);
  if (!body?.username || !body?.password) {
    return { body: { status: 1, msg: '用户名和密码不能为空' }, status: 400 };
  }
  return {
    body: { status: 0, msg: 'ok', data: { token: `mock_token_${Date.now()}`, user: { id: 1, username: body.username, nickname: body.username } } },
  };
});

// ── System ──────────────────────────────────────────────────────────
addRoute('GET', '/api/system/menu', async () => ({ body: { status: 0, msg: 'ok', data: menus } }));
addRoute('GET', '/api/system/route', async () => ({ body: { status: 0, msg: 'ok', data: routesCfg } }));

addRoute('GET', '/api/system/component', async ({ url }) => {
  const name = url.searchParams.get('name');
  const schemas = {
    dashboard: { type: 'page', title: '仪表盘', body: { type: 'flex', justify: 'center', alignItems: 'center', className: 'm-t-4xl', items: [{ type: 'tpl', tpl: '<div style="text-align:center;padding:60px 20px;"><span style="font-size:56px;">📊</span><h2 style="margin-top:16px;">欢迎使用 Admerp 中台</h2><p style="color:#999;font-size:14px;">企业管理后台系统 · 原生 Web Components + AMIS</p></div>' }] } },
    about: { type: 'page', title: '关于', body: { type: 'tpl', tpl: '<div style="text-align:center;padding:60px 20px;"><h2>Admerp 企业管理中台</h2><p style="color:#999;">版本 0.1.0</p><p style="color:#999;">原生 Web Components + AMIS</p></div>' } },
    'dept-manage': {
      type: 'page', title: '部门管理',
      body: { type: 'crud', api: '/api/dept', syncLocation: false, defaultParams: { page: 1, perPage: 10 },
        columns: [
          { name: 'id', label: 'ID', width: 60 },
          { name: 'name', label: '部门名称', searchable: { type: 'input-text', placeholder: '搜索部门名称' } },
          { name: 'code', label: '部门编码' }, { name: 'manager', label: '负责人' },
          { name: 'status', label: '状态', type: 'mapping', map: { 1: '<span style="color:#52c41a">● 启用</span>', 0: '<span style="color:#ff4d4f">● 停用</span>' } },
          { name: 'created_at', label: '创建日期' },
          { type: 'operation', label: '操作', width: 200, buttons: [
            { label: '编辑', type: 'button', actionType: 'dialog', dialog: { title: '编辑部门', body: { type: 'form', api: 'put:/api/dept/${id}', body: [
              { type: 'input-text', name: 'name', label: '部门名称', required: true }, { type: 'input-text', name: 'code', label: '部门编码' }, { type: 'input-text', name: 'manager', label: '负责人' },
              { type: 'select', name: 'status', label: '状态', options: [{ label: '启用', value: 1 }, { label: '停用', value: 0 }] },
            ]}}},
            { label: '删除', type: 'button', level: 'danger', actionType: 'ajax', api: 'delete:/api/dept/${id}', confirmText: '确定要删除该部门吗？' },
          ]},
        ],
        headerToolbar: [
          { type: 'button', label: '新增部门', icon: 'fa fa-plus', level: 'primary', actionType: 'dialog', dialog: { title: '新增部门', body: { type: 'form', api: 'post:/api/dept', body: [
            { type: 'input-text', name: 'name', label: '部门名称', required: true }, { type: 'input-text', name: 'code', label: '部门编码' }, { type: 'input-text', name: 'manager', label: '负责人' },
            { type: 'select', name: 'status', label: '状态', options: [{ label: '启用', value: 1 }, { label: '停用', value: 0 }] },
          ]}}},
          { type: 'reload', icon: 'fa fa-refresh' },
        ],
      },
    },
    'user-manage': {
      type: 'page', title: '用户管理',
      body: { type: 'crud', api: '/api/user', syncLocation: false, defaultParams: { page: 1, perPage: 10 },
        columns: [
          { name: 'id', label: 'ID', width: 60 }, { name: 'username', label: '用户名', searchable: { type: 'input-text', placeholder: '搜索用户名' } },
          { name: 'nickname', label: '昵称' }, { name: 'email', label: '邮箱' }, { name: 'dept_name', label: '部门' },
          { name: 'role', label: '角色', type: 'mapping', map: { admin: '管理员', dev: '开发', pm: '产品', finance: '财务', hr: '人事' } },
          { name: 'status', label: '状态', type: 'mapping', map: { 1: '<span style="color:#52c41a">● 启用</span>', 0: '<span style="color:#ff4d4f">● 停用</span>' } },
          { name: 'created_at', label: '创建日期' },
          { type: 'operation', label: '操作', width: 200, buttons: [
            { label: '编辑', type: 'button', actionType: 'dialog', dialog: { title: '编辑用户', body: { type: 'form', api: 'put:/api/user/${id}', body: [
              { type: 'input-text', name: 'username', label: '用户名', required: true }, { type: 'input-text', name: 'nickname', label: '昵称' }, { type: 'input-text', name: 'email', label: '邮箱' },
              { type: 'select', name: 'dept_id', label: '部门', source: '/api/dept', valueField: 'id', labelField: 'name' },
              { type: 'select', name: 'role', label: '角色', options: [{ label: '管理员', value: 'admin' }, { label: '开发', value: 'dev' }, { label: '产品', value: 'pm' }, { label: '财务', value: 'finance' }, { label: '人事', value: 'hr' }] },
              { type: 'select', name: 'status', label: '状态', options: [{ label: '启用', value: 1 }, { label: '停用', value: 0 }] },
            ]}}},
            { label: '删除', type: 'button', level: 'danger', actionType: 'ajax', api: 'delete:/api/user/${id}', confirmText: '确定要删除该用户吗？' },
          ]},
        ],
        headerToolbar: [
          { type: 'button', label: '新增用户', icon: 'fa fa-plus', level: 'primary', actionType: 'dialog', dialog: { title: '新增用户', body: { type: 'form', api: 'post:/api/user', body: [
            { type: 'input-text', name: 'username', label: '用户名', required: true }, { type: 'input-text', name: 'nickname', label: '昵称' }, { type: 'input-text', name: 'email', label: '邮箱' },
            { type: 'select', name: 'dept_id', label: '部门', source: '/api/dept', valueField: 'id', labelField: 'name' },
            { type: 'select', name: 'role', label: '角色', options: [{ label: '管理员', value: 'admin' }, { label: '开发', value: 'dev' }, { label: '产品', value: 'pm' }, { label: '财务', value: 'finance' }, { label: '人事', value: 'hr' }] },
            { type: 'select', name: 'status', label: '状态', options: [{ label: '启用', value: 1 }, { label: '停用', value: 0 }] },
          ]}}},
          { type: 'reload', icon: 'fa fa-refresh' },
        ],
      },
    },
    'product-manage': {
      type: 'page', title: '商品管理',
      body: { type: 'crud', api: '/api/product', syncLocation: false, defaultParams: { page: 1, perPage: 10 },
        columns: [
          { name: 'id', label: 'ID', width: 60 }, { name: 'name', label: '商品名称', searchable: { type: 'input-text', placeholder: '搜索商品名称' } },
          { name: 'code', label: '商品编码' }, { name: 'category', label: '分类' },
          { name: 'price', label: '单价', type: 'each', items: { type: 'tpl', tpl: '¥${price}' } }, { name: 'unit', label: '单位' },
          { name: 'status', label: '状态', type: 'mapping', map: { 1: '<span style="color:#52c41a">● 上架</span>', 0: '<span style="color:#ff4d4f">● 下架</span>' } },
          { name: 'created_at', label: '创建日期' },
          { type: 'operation', label: '操作', width: 200, buttons: [
            { label: '编辑', type: 'button', actionType: 'dialog', dialog: { title: '编辑商品', body: { type: 'form', api: 'put:/api/product/${id}', body: [
              { type: 'input-text', name: 'name', label: '商品名称', required: true }, { type: 'input-text', name: 'code', label: '商品编码' }, { type: 'input-text', name: 'category', label: '分类' },
              { type: 'input-number', name: 'price', label: '单价', step: 0.01, min: 0 }, { type: 'input-text', name: 'unit', label: '单位' },
              { type: 'select', name: 'status', label: '状态', options: [{ label: '上架', value: 1 }, { label: '下架', value: 0 }] },
            ]}}},
            { label: '删除', type: 'button', level: 'danger', actionType: 'ajax', api: 'delete:/api/product/${id}', confirmText: '确定要删除该商品吗？' },
          ]},
        ],
        headerToolbar: [
          { type: 'button', label: '新增商品', icon: 'fa fa-plus', level: 'primary', actionType: 'dialog', dialog: { title: '新增商品', body: { type: 'form', api: 'post:/api/product', body: [
            { type: 'input-text', name: 'name', label: '商品名称', required: true }, { type: 'input-text', name: 'code', label: '商品编码' }, { type: 'input-text', name: 'category', label: '分类' },
            { type: 'input-number', name: 'price', label: '单价', step: 0.01, min: 0 }, { type: 'input-text', name: 'unit', label: '单位' },
            { type: 'select', name: 'status', label: '状态', options: [{ label: '上架', value: 1 }, { label: '下架', value: 0 }] },
          ]}}},
          { type: 'reload', icon: 'fa fa-refresh' },
        ],
      },
    },
  };
  if (schemas[name]) return { body: { status: 0, msg: 'ok', data: schemas[name] } };
  return { body: { status: 1, msg: '未找到' }, status: 404 };
});

// ── Dept CRUD ───────────────────────────────────────────────────────
let deptData = [
  { id: 1, name: '技术部', code: 'TECH', manager: '张三', status: 1, created_at: '2024-01-15' },
  { id: 2, name: '产品部', code: 'PDT', manager: '李四', status: 1, created_at: '2024-01-15' },
  { id: 3, name: '财务部', code: 'FIN', manager: '王五', status: 1, created_at: '2024-02-01' },
  { id: 4, name: '人事部', code: 'HR', manager: '赵六', status: 1, created_at: '2024-02-15' },
  { id: 5, name: '市场部', code: 'MKT', manager: '钱七', status: 0, created_at: '2024-03-01' },
];
let nextDeptId = 100;

addRoute('GET', '/api/dept', async ({ url }) => {
  await delay(200);
  const name = url.searchParams.get('name')?.toLowerCase() || '';
  const filtered = name ? deptData.filter(d => d.name.toLowerCase().includes(name)) : deptData;
  return { body: { status: 0, msg: 'ok', data: paginate(filtered, url) } };
});
addRoute('POST', '/api/dept', async ({ body }) => {
  await delay(300);
  deptData.unshift({ id: nextDeptId++, name: body.name, code: body.code || '', manager: body.manager || '', status: body.status ?? 1, created_at: new Date().toISOString().slice(0, 10) });
  return { body: { status: 0, msg: '新增成功' } };
});
addRoute('PUT', '/api/dept/:id', async ({ params, body }) => {
  await delay(300);
  const idx = deptData.findIndex(d => d.id === parseInt(params.id));
  if (idx === -1) return { body: { status: 1, msg: '部门不存在' }, status: 404 };
  deptData[idx] = { ...deptData[idx], ...body };
  return { body: { status: 0, msg: '更新成功' } };
});
addRoute('DELETE', '/api/dept/:id', async ({ params }) => {
  await delay(300);
  deptData = deptData.filter(d => d.id !== parseInt(params.id));
  return { body: { status: 0, msg: '删除成功' } };
});

// ── User CRUD ───────────────────────────────────────────────────────
let userData = [
  { id: 1, username: 'admin', nickname: '管理员', email: 'admin@admerp.com', dept_id: 1, dept_name: '技术部', role: 'admin', status: 1, created_at: '2024-01-01' },
  { id: 2, username: 'zhangsan', nickname: '张三', email: 'zhangsan@admerp.com', dept_id: 1, dept_name: '技术部', role: 'dev', status: 1, created_at: '2024-01-15' },
  { id: 3, username: 'lisi', nickname: '李四', email: 'lisi@admerp.com', dept_id: 2, dept_name: '产品部', role: 'pm', status: 1, created_at: '2024-01-20' },
  { id: 4, username: 'wangwu', nickname: '王五', email: 'wangwu@admerp.com', dept_id: 3, dept_name: '财务部', role: 'finance', status: 1, created_at: '2024-02-01' },
  { id: 5, username: 'zhaoliu', nickname: '赵六', email: 'zhaoliu@admerp.com', dept_id: 4, dept_name: '人事部', role: 'hr', status: 0, created_at: '2024-02-15' },
];
let nextUserId = 100;

addRoute('GET', '/api/user', async ({ url }) => {
  await delay(200);
  const username = url.searchParams.get('username')?.toLowerCase() || '';
  const filtered = username ? userData.filter(u => u.username.toLowerCase().includes(username)) : userData;
  return { body: { status: 0, msg: 'ok', data: paginate(filtered, url) } };
});
addRoute('POST', '/api/user', async ({ body }) => {
  await delay(300);
  const dept = deptData.find(d => d.id === body.dept_id);
  userData.unshift({ id: nextUserId++, username: body.username, nickname: body.nickname || body.username, email: body.email || '', dept_id: body.dept_id || 0, dept_name: dept?.name || '', role: body.role || 'dev', status: body.status ?? 1, created_at: new Date().toISOString().slice(0, 10) });
  return { body: { status: 0, msg: '新增成功' } };
});
addRoute('PUT', '/api/user/:id', async ({ params, body }) => {
  await delay(300);
  const idx = userData.findIndex(u => u.id === parseInt(params.id));
  if (idx === -1) return { body: { status: 1, msg: '用户不存在' }, status: 404 };
  const dept = body.dept_id ? deptData.find(d => d.id === body.dept_id) : null;
  userData[idx] = { ...userData[idx], ...body, dept_name: dept?.name || userData[idx].dept_name };
  return { body: { status: 0, msg: '更新成功' } };
});
addRoute('DELETE', '/api/user/:id', async ({ params }) => {
  await delay(300);
  userData = userData.filter(u => u.id !== parseInt(params.id));
  return { body: { status: 0, msg: '删除成功' } };
});

// ── Product CRUD ────────────────────────────────────────────────────
let productData = [
  { id: 1, name: '笔记本电脑', code: 'P001', category: '电子设备', price: 5999.00, unit: '台', status: 1, created_at: '2024-03-01' },
  { id: 2, name: '无线鼠标', code: 'P002', category: '外设', price: 89.00, unit: '个', status: 1, created_at: '2024-03-05' },
  { id: 3, name: '机械键盘', code: 'P003', category: '外设', price: 399.00, unit: '个', status: 1, created_at: '2024-03-10' },
  { id: 4, name: '显示器 27寸', code: 'P004', category: '电子设备', price: 2499.00, unit: '台', status: 0, created_at: '2024-03-15' },
  { id: 5, name: 'USB-C 扩展坞', code: 'P005', category: '配件', price: 199.00, unit: '个', status: 1, created_at: '2024-03-20' },
];
let nextProductId = 100;

addRoute('GET', '/api/product', async ({ url }) => {
  await delay(200);
  const name = url.searchParams.get('name')?.toLowerCase() || '';
  const filtered = name ? productData.filter(p => p.name.toLowerCase().includes(name)) : productData;
  return { body: { status: 0, msg: 'ok', data: paginate(filtered, url) } };
});
addRoute('POST', '/api/product', async ({ body }) => {
  await delay(300);
  productData.unshift({ id: nextProductId++, name: body.name, code: body.code || '', category: body.category || '', price: body.price ?? 0, unit: body.unit || '', status: body.status ?? 1, created_at: new Date().toISOString().slice(0, 10) });
  return { body: { status: 0, msg: '新增成功' } };
});
addRoute('PUT', '/api/product/:id', async ({ params, body }) => {
  await delay(300);
  const idx = productData.findIndex(p => p.id === parseInt(params.id));
  if (idx === -1) return { body: { status: 1, msg: '商品不存在' }, status: 404 };
  productData[idx] = { ...productData[idx], ...body };
  return { body: { status: 0, msg: '更新成功' } };
});
addRoute('DELETE', '/api/product/:id', async ({ params }) => {
  await delay(300);
  productData = productData.filter(p => p.id !== parseInt(params.id));
  return { body: { status: 0, msg: '删除成功' } };
});

// ── Fetch interceptor ───────────────────────────────────────────────
const origFetch = window.fetch;

export async function mockFetch(url, options = {}) {
  const result = await dispatch(url, options);
  if (result) {
    return new Response(JSON.stringify(result.body), {
      status: result.status || 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return origFetch.call(window, url, options);
}

window.fetch = mockFetch;
