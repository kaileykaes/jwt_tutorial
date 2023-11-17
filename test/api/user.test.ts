import { createHandler, type ServeHandlerInfo } from '$fresh/server.ts';
import manifest from '../../fresh.gen.ts';
import config from '../../fresh.config.ts';
import { assertEquals } from '$std/assert/mod.ts';

const hostname = '127.0.0.1';
const root = `http://${hostname}`;

const CONN_INFO: ServeHandlerInfo = {
  remoteAddr: { hostname, port: 53496, transport: 'tcp' },
};

await Deno.test('Users', async (t) => {
  const handler = await createHandler(manifest, config);
  const name = crypto.randomUUID();

  let resp: Response | undefined = undefined;

  await t.step('create', async () => {
    resp = await handler(
      new Request(`${root}/api/users`, {
        method: 'POST',
        body: '',
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 400);

    resp = await handler(
      new Request(`${root}/api/users`, {
        method: 'POST',
        body: JSON.stringify({
          password: 'test',
        }),
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 400);

    resp = await handler(
      new Request(`${root}/api/users`, {
        method: 'POST',
        body: JSON.stringify({
          name,
        }),
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 400);

    resp = await handler(
      new Request(`${root}/api/users`, {
        method: 'POST',
        body: JSON.stringify([]),
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 400);

    resp = await handler(
      new Request(`${root}/api/users`, {
        method: 'POST',
        body: JSON.stringify({
          name,
          password: 'test',
        }),
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 200);

    resp = await handler(
      new Request(`${root}/api/users`, {
        method: 'POST',
        body: JSON.stringify({
          name,
          password: 'test',
        }),
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 409);
  });

  await t.step('login', async () => {
    resp = await handler(
      new Request(`${root}/api/sessions`, {
        method: 'POST',
        body: JSON.stringify({
          name,
          password: 'bad password',
        }),
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 401);

    resp = await handler(
      new Request(`${root}/api/sessions`, {
        method: 'POST',
        body: JSON.stringify({
          name,
          password: 'test',
        }),
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 200);
  });

  const { refreshToken } = await resp!.json();

  await t.step('refresh', async () => {
    resp = await handler(
      new Request(`${root}/api/sessions`, {
        method: 'PUT',
        body: JSON.stringify({
          refreshToken: 'INVALID',
        }),
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 401);

    resp = await handler(
      new Request(`${root}/api/sessions`, {
        method: 'PUT',
        body: JSON.stringify({
          refreshToken,
        }),
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 200);
  });

  let { userId, token } = await resp!.json();
  const headers = {
    'Authorization': `bearer ${token}`,
  };

  await t.step('sessions', async () => {
    resp = await handler(
      new Request(`${root}/api/sessions`, {
        method: 'GET',
        headers,
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 200);
  });

  await t.step('modify', async () => {
    resp = await handler(
      new Request(`${root}/api/users/${userId}`, {
        method: 'PUT',
        headers,
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 400);

    resp = await handler(
      new Request(`${root}/api/users/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify([]),
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 400);

    resp = await handler(
      new Request(`${root}/api/users/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({}),
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 400);

    resp = await handler(
      new Request(`${root}/api/users/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          password: '',
        }),
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 400);

    resp = await handler(
      new Request(`${root}/api/users/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          password: 9,
        }),
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 400);

    // Side-effect: logged out
    resp = await handler(
      new Request(`${root}/api/users/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          password: 'test2',
        }),
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 200);

    // Log back in so remaining tests work
    resp = await handler(
      new Request(`${root}/api/sessions`, {
        method: 'POST',
        body: JSON.stringify({
          name,
          password: 'test2',
        }),
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 200);
    ({ userId, token } = await resp.json());
    headers.Authorization = `bearer ${token}`;
  });

  await t.step('delete', async () => {
    resp = await handler(
      new Request(`${root}/api/users/UNKNOWN`, {
        method: 'DELETE',
        headers,
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 401);

    // Side-effect: logged out
    resp = await handler(
      new Request(`${root}/api/users/${userId}`, {
        method: 'DELETE',
        headers,
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 200);

    resp = await handler(
      new Request(`${root}/api/users/${userId}`, {
        method: 'DELETE',
        headers,
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 401);
  });
});
