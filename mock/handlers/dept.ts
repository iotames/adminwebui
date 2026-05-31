import { http, HttpResponse, delay } from 'msw';
import { depts } from '../data';

let deptData = [...depts];
let nextId = 100;

export const deptHandlers = [
  http.get('/api/dept', async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('perPage') || '10');
    const name = url.searchParams.get('name')?.toLowerCase() || '';

    let filtered = deptData;
    if (name) {
      filtered = deptData.filter(d => d.name.toLowerCase().includes(name));
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

  http.post('/api/dept', async ({ request }) => {
    await delay(300);
    const body = await request.json() as any;
    const newDept = {
      id: nextId++,
      name: body.name,
      code: body.code || '',
      manager: body.manager || '',
      status: body.status ?? 1,
      created_at: new Date().toISOString().slice(0, 10),
    };
    deptData.unshift(newDept);
    return HttpResponse.json({ status: 0, msg: '新增成功' });
  }),

  http.put('/api/dept/:id', async ({ params, request }) => {
    await delay(300);
    const id = parseInt(params.id as string);
    const body = await request.json() as any;
    const idx = deptData.findIndex(d => d.id === id);
    if (idx === -1) {
      return HttpResponse.json({ status: 1, msg: '部门不存在' }, { status: 404 });
    }
    deptData[idx] = { ...deptData[idx], ...body };
    return HttpResponse.json({ status: 0, msg: '更新成功' });
  }),

  http.delete('/api/dept/:id', async ({ params }) => {
    await delay(300);
    const id = parseInt(params.id as string);
    deptData = deptData.filter(d => d.id !== id);
    return HttpResponse.json({ status: 0, msg: '删除成功' });
  }),
];
