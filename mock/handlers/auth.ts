import { http, HttpResponse, delay } from 'msw';

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    await delay(600);
    const body = await request.json() as any;

    if (!body.username || !body.password) {
      return HttpResponse.json(
        { status: 1, msg: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      token: `mock_token_${Date.now()}`,
      user: {
        id: 1,
        username: body.username,
        nickname: body.username,
      },
    });
  }),
];
