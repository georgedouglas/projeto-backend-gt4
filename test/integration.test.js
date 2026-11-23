import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { sequelize } from '../connection.js';
import Category from '../models/categoryModel.js';
import { Product, ProductImage, ProductOption } from '../models/productModel.js';
import User from '../models/userModel.js';
import { client } from './client.js';

test('fluxo de usuários, categorias e produtos com MySQL', async t => {
  const suffix = randomUUID();
  const email = suffix + '@example.com';
  const password = 'SenhaExemplo123';
  const slug = 'tenis-' + suffix;
  const request = await client(t);
  t.after(async () => {
    try {
      await Product.destroy({ where: { slug } });
      await Category.destroy({ where: { slug } });
      await User.destroy({ where: { email } });
    } finally {
      await sequelize.close();
    }
  });

  const userPayload = { firstname: 'Ana', surname: 'Teste', email, password, confirmPassword: password };
  const user = await request('/v1/user', 201, { method: 'POST', body: userPayload });
  await request('/v1/user', 409, { method: 'POST', body: userPayload });
  assert.equal((await request('/v1/user/' + user.id, 200)).password, undefined);
  await request('/v1/user/token', 400, { method: 'POST', body: { email, password: 'errada' } });
  const { token } = await request('/v1/user/token', 200, { method: 'POST', body: { email, password } });
  await request('/v1/user/' + (user.id + 1), 403, { method: 'PUT', token, body: { surname: 'Outro' } });
  await request('/v1/user/' + user.id, 204, { method: 'PUT', token, body: { surname: 'Novo' } });

  const category = await request('/v1/category', 201, {
    method: 'POST', token, body: { name: 'Tênis', slug, use_in_menu: true }
  });
  const categoryPath = '/v1/category/' + category.id;
  await request(categoryPath, 204, { method: 'PUT', token, body: { name: 'Calçados' } });
  assert.equal((await request(categoryPath, 200)).name, 'Calçados');
  assert.ok((await request('/v1/category/search?limit=-1&fields=id&use_in_menu=true', 200))
    .data.some(row => row.id === category.id && Object.keys(row).length === 1));

  const productBody = {
    enabled: true, name: 'Tênis ' + suffix, slug, stock: 10, price: 100, price_with_discount: 90,
    category_ids: [category.id],
    images: [{ path: 'http://localhost:3000/public/imagem-teste.png' }],
    options: [{ title: 'Tamanho', values: ['40', '41'] }]
  };
  await request('/v1/product', 400, {
    method: 'POST', token, body: { ...productBody, options: [{ title: 'Inválido' }] }
  });
  await request('/v1/product', 400, {
    method: 'POST', token,
    body: { ...productBody, images: [{ path: 'data:image/png;base64,aGVsbG8=' }] }
  });
  assert.equal(await Product.count({ where: { slug } }), 0);
  const product = await request('/v1/product', 201, { method: 'POST', token, body: productBody });
  const productPath = '/v1/product/' + product.id;
  assert.deepEqual(product.category_ids, [category.id]);
  assert.deepEqual(product.options[0].values, ['40', '41']);
  assert.equal(product.images[0].path, 'http://localhost:3000/public/imagem-teste.png');

  const search = '/v1/product/search?' + new URLSearchParams({
    match: suffix, category_ids: category.id, 'price-range': '50-120',
    ['option[' + product.options[0].id + ']']: '40', fields: 'id,name', page: '1', limit: '1'
  });
  assert.deepEqual(await request(search, 200), {
    data: [{ id: product.id, name: productBody.name }], total: 1, page: 1, limit: 1
  });

  await request(productPath, 204, {
    method: 'PUT', token, body: {
      category_ids: [], stock: 5,
      options: [{ id: product.options[0].id, values: ['41'] }],
      images: [{ id: product.images[0].id, deleted: true }, { path: 'https://example.com/tenis.png' }]
    }
  });
  const updated = await request(productPath, 200);
  assert.deepEqual(updated.options[0].values, ['41']);
  assert.deepEqual(updated.category_ids, []);
  assert.equal(updated.images.length, 1);
  assert.equal(updated.stock, 5);
  await request(productPath, 204, { method: 'DELETE', token });
  await request(productPath, 404);
  assert.equal(await ProductImage.count({ where: { product_id: product.id } }), 0);
  assert.equal(await ProductOption.count({ where: { product_id: product.id } }), 0);
  await request(categoryPath, 204, { method: 'DELETE', token });
  await request('/v1/user/' + user.id, 204, { method: 'DELETE', token });
  await request('/v1/category', 401, { method: 'POST', token, body: {} });
});
