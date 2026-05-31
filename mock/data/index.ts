export const menus = [
  {
    id: '1',
    path: '/dashboard',
    title: '仪表盘',
    icon: '📊',
    children: [],
  },
  {
    id: '2',
    path: '/system',
    title: '系统管理',
    icon: '⚙️',
    children: [
      { id: '2-1', path: '/dept', title: '部门管理' },
      { id: '2-2', path: '/user', title: '用户管理' },
    ],
  },
  {
    id: '3',
    path: '/product',
    title: '商品管理',
    icon: '📦',
    children: [],
  },
  {
    id: '4',
    path: '/about',
    title: '关于',
    icon: 'ℹ️',
    children: [],
  },
];

export const routes = [
  { path: '/login', title: '登录', component: 'wc://login-page', auth: false },
  { path: '/dashboard', title: '仪表盘', component: 'amis://dashboard', auth: true },
  { path: '/dept', title: '部门管理', component: 'amis://dept-manage', auth: true },
  { path: '/user', title: '用户管理', component: 'amis://user-manage', auth: true },
  { path: '/product', title: '商品管理', component: 'amis://product-manage', auth: true },
  { path: '/about', title: '关于', component: 'amis://about', auth: true },
];

export const depts = [
  { id: 1, name: '技术部', code: 'TECH', manager: '张三', status: 1, created_at: '2024-01-15' },
  { id: 2, name: '产品部', code: 'PDT', manager: '李四', status: 1, created_at: '2024-01-15' },
  { id: 3, name: '财务部', code: 'FIN', manager: '王五', status: 1, created_at: '2024-02-01' },
  { id: 4, name: '人事部', code: 'HR', manager: '赵六', status: 1, created_at: '2024-02-15' },
  { id: 5, name: '市场部', code: 'MKT', manager: '钱七', status: 0, created_at: '2024-03-01' },
];

export const users = [
  { id: 1, username: 'admin', nickname: '管理员', email: 'admin@admerp.com', dept_id: 1, dept_name: '技术部', role: 'admin', status: 1, created_at: '2024-01-01' },
  { id: 2, username: 'zhangsan', nickname: '张三', email: 'zhangsan@admerp.com', dept_id: 1, dept_name: '技术部', role: 'dev', status: 1, created_at: '2024-01-15' },
  { id: 3, username: 'lisi', nickname: '李四', email: 'lisi@admerp.com', dept_id: 2, dept_name: '产品部', role: 'pm', status: 1, created_at: '2024-01-20' },
  { id: 4, username: 'wangwu', nickname: '王五', email: 'wangwu@admerp.com', dept_id: 3, dept_name: '财务部', role: 'finance', status: 1, created_at: '2024-02-01' },
  { id: 5, username: 'zhaoliu', nickname: '赵六', email: 'zhaoliu@admerp.com', dept_id: 4, dept_name: '人事部', role: 'hr', status: 0, created_at: '2024-02-15' },
];

export const products = [
  { id: 1, name: '笔记本电脑', code: 'P001', category: '电子设备', price: 5999.00, unit: '台', status: 1, created_at: '2024-03-01' },
  { id: 2, name: '无线鼠标', code: 'P002', category: '外设', price: 89.00, unit: '个', status: 1, created_at: '2024-03-05' },
  { id: 3, name: '机械键盘', code: 'P003', category: '外设', price: 399.00, unit: '个', status: 1, created_at: '2024-03-10' },
  { id: 4, name: '显示器 27寸', code: 'P004', category: '电子设备', price: 2499.00, unit: '台', status: 0, created_at: '2024-03-15' },
  { id: 5, name: 'USB-C 扩展坞', code: 'P005', category: '配件', price: 199.00, unit: '个', status: 1, created_at: '2024-03-20' },
];
