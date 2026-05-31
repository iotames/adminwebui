import { http, HttpResponse, delay } from 'msw';
import { users, depts } from '../data';

let userData = [...users];
let nextId = 100;

export const userHandlers = [
  http.get('/api/user', async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('perPage') || '10');
    const username = url.searchParams.get('username')?.toLowerCase() || '';

    let filtered = userData;
    if (username) {
      filtered = userData.filter(u => u.username.toLowerCase().includes(username));
    }

    const total = filtered.length;
    const items = filtered.slice((page - 1) * perPage, page * perPage);

    return HttpResponse.json({
      status: 0,
      msg: 'ok',
      data: {
        items,
        total,
        count: items.length,
        page,
        perPage,
      },
    });
  }),

  http.post('/api/user', async ({ request }) => {
    await delay(300);
    const body = await request.json() as any;
    const dept = depts.find(d => d.id === body.dept_id);
    const newUser = {
      id: nextId++,
      username: body.username,
      nickname: body.nickname || body.username,
      email: body.email || '',
      dept_id: body.dept_id || 0,
      dept_name: dept?.name || '',
      role: body.role || 'dev',
      status: body.status ?? 1,
      created_at: new Date().toISOString().slice(0, 10),
    };
    userData.unshift(newUser);
    return HttpResponse.json({ status: 0, msg: '新增成功' });
  }),

  http.put('/api/user/:id', async ({ params, request }) => {
    await delay(300);
    const id = parseInt(params.id as string);
    const body = await request.json() as any;
    const idx = userData.findIndex(u => u.id === id);
    if (idx === -1) {
      return HttpResponse.json({ status: 1, msg: '用户不存在' }, { status: 404 });
    }
    const dept = body.dept_id ? depts.find(d => d.id === body.dept_id) : null;
    userData[idx] = {
      ...userData[idx],
      ...body,
      dept_name: dept?.name || userData[idx].dept_name,
    };
    return HttpResponse.json({ status: 0, msg: '更新成功' });
  }),

  http.delete('/api/user/:id', async ({ params }) => {
    await delay(300);
    const id = parseInt(params.id as string);
    userData = userData.filter(u => u.id !== id);
    return HttpResponse.json({ status: 0, msg: '删除成功' });
  }),
];
