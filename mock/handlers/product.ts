import { http, HttpResponse, delay } from 'msw';
import { products } from '../data';

let productData = [...products];
let nextId = 100;

export const productHandlers = [
  http.get('/api/product', async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('perPage') || '10');
    const name = url.searchParams.get('name')?.toLowerCase() || '';

    let filtered = productData;
    if (name) {
      filtered = productData.filter(p => p.name.toLowerCase().includes(name));
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

  http.post('/api/product', async ({ request }) => {
    await delay(300);
    const body = await request.json() as any;
    const newProduct = {
      id: nextId++,
      name: body.name,
      code: body.code || '',
      category: body.category || '',
      price: body.price ?? 0,
      unit: body.unit || '',
      status: body.status ?? 1,
      created_at: new Date().toISOString().slice(0, 10),
    };
    productData.unshift(newProduct);
    return HttpResponse.json({ status: 0, msg: '新增成功' });
  }),

  http.put('/api/product/:id', async ({ params, request }) => {
    await delay(300);
    const id = parseInt(params.id as string);
    const body = await request.json() as any;
    const idx = productData.findIndex(p => p.id === id);
    if (idx === -1) {
      return HttpResponse.json({ status: 1, msg: '商品不存在' }, { status: 404 });
    }
    productData[idx] = { ...productData[idx], ...body };
    return HttpResponse.json({ status: 0, msg: '更新成功' });
  }),

  http.delete('/api/product/:id', async ({ params }) => {
    await delay(300);
    const id = parseInt(params.id as string);
    productData = productData.filter(p => p.id !== id);
    return HttpResponse.json({ status: 0, msg: '删除成功' });
  }),
];
