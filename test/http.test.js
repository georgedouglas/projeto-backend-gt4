import assert from 'node:assert/strict';
import test from 'node:test';
import { client } from './client.js';

test('rotas públicas, OpenAPI e respostas de erro', async t => {
  process.env.JWT_SECRET = 'testing-secret-for-local-http-tests';
  const request = await client(t);
  assert.deepEqual(await request('/health', 200), { status: 'ok' });
  const spec = await request('/openapi.json', 200);
  assert.equal(spec.openapi, '3.0.3');
  assert.equal(Object.keys(spec.paths).length, 10);
  await request('/v1/user', 400, { method: 'POST', body: {} });
  await request('/v1/user/abc', 400);
  await request('/v1/category/search?limit=0', 400);
  await request('/v1/product/search?price-range=20-10', 400);
  await request('/v1/product', 401, { method: 'POST', body: {} });
  await request('/v1/product/1', 401, { method: 'DELETE', token: 'invalid' });
  const image = await request('/public/imagem-teste.png', 200);
  assert.deepEqual([...image.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  await request('/public/nao-existe.png', 404);
  await request('/rota-inexistente', 404);
});
