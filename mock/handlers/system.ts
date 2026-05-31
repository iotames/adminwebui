import { http, HttpResponse } from 'msw';
import { menus, routes } from '../data';

export const systemHandlers = [
  http.get('/api/system/menu', () => {
    return HttpResponse.json(menus);
  }),

  http.get('/api/system/route', () => {
    return HttpResponse.json(routes);
  }),

  http.get('/api/system/component', async ({ request }) => {
    const url = new URL(request.url);
    const name = url.searchParams.get('name');

    const schemas: Record<string, any> = {
      'dashboard': {
        type: 'page',
        title: '仪表盘',
        body: {
          type: 'flex',
          justify: 'center',
          alignItems: 'center',
          className: 'm-t-4xl',
          items: [
            {
              type: 'tpl',
              tpl: '<div style="text-align:center;padding:60px 20px;"><span style="font-size:56px;">📊</span><h2 style="margin-top:16px;">欢迎使用 Admerp 中台</h2><p style="color:#999;font-size:14px;">企业管理后台系统 · 基于原生 Web Components + AMIS 低代码引擎</p></div>',
            },
          ],
        },
      },
      'about': {
        type: 'page',
        title: '关于',
        body: [
          { type: 'tpl', tpl: '<div style="text-align:center;padding:60px 20px;"><h2>Admerp 企业管理中台</h2><p style="color:#999;">版本 0.1.0</p><p style="color:#999;">基于原生 Web Components + AMIS 低代码引擎</p></div>' },
        ],
      },
    };

    const deptSchema = {
      type: 'page',
      title: '部门管理',
      body: {
        type: 'crud',
        api: '/api/dept',
        syncLocation: false,
        defaultParams: { page: 1, perPage: 10 },
        columns: [
          { name: 'id', label: 'ID', width: 60 },
          { name: 'name', label: '部门名称', searchable: { type: 'input-text', placeholder: '搜索部门名称' } },
          { name: 'code', label: '部门编码' },
          { name: 'manager', label: '负责人' },
          { name: 'status', label: '状态', type: 'mapping', map: { 1: '<span style="color:#52c41a">● 启用</span>', 0: '<span style="color:#ff4d4f">● 停用</span>' } },
          { name: 'created_at', label: '创建日期' },
          {
            type: 'operation',
            label: '操作',
            width: 200,
            buttons: [
              {
                label: '编辑',
                type: 'button',
                actionType: 'dialog',
                dialog: {
                  title: '编辑部门',
                  body: {
                    type: 'form',
                    api: 'put:/api/dept/${id}',
                    body: [
                      { type: 'input-text', name: 'name', label: '部门名称', required: true },
                      { type: 'input-text', name: 'code', label: '部门编码' },
                      { type: 'input-text', name: 'manager', label: '负责人' },
                      { type: 'select', name: 'status', label: '状态', options: [{ label: '启用', value: 1 }, { label: '停用', value: 0 }] },
                    ],
                  },
                },
              },
              {
                label: '删除',
                type: 'button',
                level: 'danger',
                actionType: 'ajax',
                api: 'delete:/api/dept/${id}',
                confirmText: '确定要删除该部门吗？',
              },
            ],
          },
        ],
        headerToolbar: [
          {
            type: 'button',
            label: '新增部门',
            icon: 'fa fa-plus',
            level: 'primary',
            actionType: 'dialog',
            dialog: {
              title: '新增部门',
              body: {
                type: 'form',
                api: 'post:/api/dept',
                body: [
                  { type: 'input-text', name: 'name', label: '部门名称', required: true },
                  { type: 'input-text', name: 'code', label: '部门编码' },
                  { type: 'input-text', name: 'manager', label: '负责人' },
                  { type: 'select', name: 'status', label: '状态', options: [{ label: '启用', value: 1 }, { label: '停用', value: 0 }] },
                ],
              },
            },
          },
          { type: 'reload', icon: 'fa fa-refresh' },
        ],
      },
    };

    const userSchema = {
      type: 'page',
      title: '用户管理',
      body: {
        type: 'crud',
        api: '/api/user',
        syncLocation: false,
        defaultParams: { page: 1, perPage: 10 },
        columns: [
          { name: 'id', label: 'ID', width: 60 },
          { name: 'username', label: '用户名', searchable: { type: 'input-text', placeholder: '搜索用户名' } },
          { name: 'nickname', label: '昵称' },
          { name: 'email', label: '邮箱' },
          { name: 'dept_name', label: '部门' },
          { name: 'role', label: '角色', type: 'mapping', map: { admin: '管理员', dev: '开发', pm: '产品', finance: '财务', hr: '人事' } },
          { name: 'status', label: '状态', type: 'mapping', map: { 1: '<span style="color:#52c41a">● 启用</span>', 0: '<span style="color:#ff4d4f">● 停用</span>' } },
          { name: 'created_at', label: '创建日期' },
          {
            type: 'operation',
            label: '操作',
            width: 200,
            buttons: [
              {
                label: '编辑',
                type: 'button',
                actionType: 'dialog',
                dialog: {
                  title: '编辑用户',
                  body: {
                    type: 'form',
                    api: 'put:/api/user/${id}',
                    body: [
                      { type: 'input-text', name: 'username', label: '用户名', required: true },
                      { type: 'input-text', name: 'nickname', label: '昵称' },
                      { type: 'input-text', name: 'email', label: '邮箱' },
                      { type: 'select', name: 'dept_id', label: '部门', source: '/api/dept?perPage=100', valueField: 'id', labelField: 'name' },
                      { type: 'select', name: 'role', label: '角色', options: [{ label: '管理员', value: 'admin' }, { label: '开发', value: 'dev' }, { label: '产品', value: 'pm' }, { label: '财务', value: 'finance' }, { label: '人事', value: 'hr' }] },
                      { type: 'select', name: 'status', label: '状态', options: [{ label: '启用', value: 1 }, { label: '停用', value: 0 }] },
                    ],
                  },
                },
              },
              {
                label: '删除',
                type: 'button',
                level: 'danger',
                actionType: 'ajax',
                api: 'delete:/api/user/${id}',
                confirmText: '确定要删除该用户吗？',
              },
            ],
          },
        ],
        headerToolbar: [
          {
            type: 'button',
            label: '新增用户',
            icon: 'fa fa-plus',
            level: 'primary',
            actionType: 'dialog',
            dialog: {
              title: '新增用户',
              body: {
                type: 'form',
                api: 'post:/api/user',
                body: [
                  { type: 'input-text', name: 'username', label: '用户名', required: true },
                  { type: 'input-text', name: 'nickname', label: '昵称' },
                  { type: 'input-text', name: 'email', label: '邮箱' },
                  { type: 'select', name: 'dept_id', label: '部门', source: '/api/dept?perPage=100', valueField: 'id', labelField: 'name' },
                  { type: 'select', name: 'role', label: '角色', options: [{ label: '管理员', value: 'admin' }, { label: '开发', value: 'dev' }, { label: '产品', value: 'pm' }, { label: '财务', value: 'finance' }, { label: '人事', value: 'hr' }] },
                  { type: 'select', name: 'status', label: '状态', options: [{ label: '启用', value: 1 }, { label: '停用', value: 0 }] },
                ],
              },
            },
          },
          { type: 'reload', icon: 'fa fa-refresh' },
        ],
      },
    };

    if (name === 'dept-manage') {
      return HttpResponse.json(deptSchema);
    }
    if (name === 'user-manage') {
      return HttpResponse.json(userSchema);
    }
    if (schemas[name!]) {
      return HttpResponse.json(schemas[name!]);
    }

    return HttpResponse.json(
      { type: 'page', title: '未知页面', body: `<p>组件 "${name}" 未找到</p>` },
      { status: 404 }
    );
  }),
];
