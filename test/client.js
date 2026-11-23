import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { app } from '../app.js';

export async function client(t) {
  const name = 'drip-' + randomUUID();
  const socketPath = process.platform === 'win32' ? '\\\\.\\pipe\\' + name : join(tmpdir(), name);
  const server = app.listen(socketPath);
  t.after(() => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  await once(server, 'listening');
  return async (path, status, { method = 'GET', body, token, headers = {} } = {}) => {
    const bodyJson = body === undefined ? undefined : JSON.stringify(body);
    const response = await new Promise((resolve, reject) => {
      const req = request({
        socketPath, path, method,
        headers: {
          ...headers,
          ...(bodyJson !== undefined && {
            'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyJson)
          }),
          ...(token && { Authorization: 'Bearer ' + token })
        }
      }, resolve);
      req.on('error', reject);
      req.end(bodyJson);
    });
    const chunks = [];
    for await (const chunk of response) chunks.push(chunk);
    const raw = Buffer.concat(chunks);
    assert.equal(response.statusCode, status, method + ' ' + path + ' - ' + raw.toString());
    if (!raw.length) return undefined;
    const contentType = response.headers['content-type'];
    return contentType?.startsWith('application/json') ? JSON.parse(raw.toString()) : raw;
  };
}
