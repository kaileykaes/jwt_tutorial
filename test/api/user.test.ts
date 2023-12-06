import { createHandler, type ServeHandlerInfo } from '$fresh/server.ts';
import manifest from '../../fresh.gen.ts';
import config from '../../fresh.config.ts';
import { assertEquals } from '$std/assert/mod.ts';
import { z } from 'zod';
import { JWT_REGEX } from '../../schema/refreshToken.ts';

const hostname = '127.0.0.1';
const root = `http://${hostname}`;

const CONN_INFO: ServeHandlerInfo = {
  remoteAddr: { hostname, port: 53496, transport: 'tcp' },
};

await Deno.test('Users', async (t) => {
  const handler = await createHandler(manifest, config);
  const name = crypto.randomUUID();
  const password = crypto.randomUUID();

  let resp: Response | undefined = undefined;
  let json: any;

  const CreateResult = z.object({
    id: z.string().ulid(),
    name: z.string().uuid(),
  }).strict();

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
          password,
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
          password,
        }),
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 200);
    CreateResult.parse(await resp.json());

    resp = await handler(
      new Request(`${root}/api/users`, {
        method: 'POST',
        body: JSON.stringify({
          name,
          password,
        }),
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 409);
  });

  const LoginResult = z.object({
    name: z.string().uuid(),
    userId: z.string().ulid(),
    token: z.string().regex(JWT_REGEX),
    duration: z.number().gt(0),
    refreshToken: z.string().regex(JWT_REGEX),
    refreshDuration: z.number().gt(0),
  }).strict();

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
          password,
        }),
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 200);
    json = await resp.json();
    LoginResult.parse(json);
  });

  const { refreshToken } = json;

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
    json = await resp.json();
    LoginResult.parse(json);
  });

  let { userId, token } = json;
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
    const SessionResult = z.array(
      z.object({
        jti: z.string().ulid(),
        iss: z.string().url(),
        sub: z.string().ulid(),
        name: z.string().uuid(),
        roles: z.array(z.string()).length(0),
        nbf: z.number().gt(0),
        exp: z.number().gt(0),
        clientIP: z.string().ip(),
      }).strict(),
    );
    SessionResult.parse(await resp.json());
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
          password: 'morepie',
        }),
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 200);
    CreateResult.parse(await resp.json());

    // Log back in so remaining tests work
    resp = await handler(
      new Request(`${root}/api/sessions`, {
        method: 'POST',
        body: JSON.stringify({
          name,
          password: 'morepie',
        }),
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 200);
    json = await resp.json();
    LoginResult.parse(json);
    ({ userId, token } = json);
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
    z.string().ulid().parse(await resp.json());

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
