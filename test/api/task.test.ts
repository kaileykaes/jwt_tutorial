import { createHandler, type ServeHandlerInfo } from '$fresh/server.ts';
import manifest from '../../fresh.gen.ts';
import config from '../../fresh.config.ts';
import { assertEquals } from '$std/assert/mod.ts';

const hostname = '127.0.0.1';
const root = `http://${hostname}`;

const CONN_INFO: ServeHandlerInfo = {
  remoteAddr: { hostname, port: 53496, transport: 'tcp' },
};

await Deno.test('Tasks', async (t) => {
  const handler = await createHandler(manifest, config);
  const name = crypto.randomUUID()
  console.log(name)

  let resp: Response | undefined = undefined;

//creates user
  await handler(
    new Request(`${root}/api/users`, {
      method: 'POST',
      body: JSON.stringify({
        name,
        password: 'test'
      }),
    }),
    CONN_INFO,
  );
//starts session for created user
  resp = await handler(
      new Request(`${root}/api/sessions`, {
        method: 'POST',
        body: JSON.stringify({
          name,
          password: 'test'
        }),
      }),
      CONN_INFO,
    );
//authorization
  const token = await resp!.json();
  const headers = {
    'Authorization': `bearer ${token}`,
  };

  await t.step('create', async () => {
    resp = await handler(
      new Request(`${root}/api/tasks`, {
        method: 'POST',
        body: '',
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 401);

    resp = await handler(
      new Request(`${root}/api/tasks`, {
        method: 'POST',
        body: '',
        headers,
      }),
      CONN_INFO
    );
    assertEquals(resp.status, 500)

    resp = await handler(
      new Request(`${root}/api/tasks`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'Wash the cats',
        }),
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 200);
  });

  const task = await resp!.json();

  await t.step('get tasks', async () => {
    resp = await handler(
      new Request(`${root}/api/tasks`, {
        method: 'GET',
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 401);

    resp = await handler(
      new Request(`${root}/api/tasks`, {
        method: 'GET',
        headers
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 200)
  });

  await t.step('single task', async () => {
    resp = await handler(
      new Request(`${root}/api/tasks/${task.id}`,{
        method: 'GET',
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 401);

    resp = await handler(
      new Request(`${root}/api/tasks/${crypto.randomUUID()}`,{
        method: 'GET',
        headers,
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 404);

    resp = await handler(
      new Request(`${root}/api/tasks/${task.id}`, {
        method: 'GET',
        headers,
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 200)
  });

  await t.step('update', async () => {
    resp = await handler(
      new Request(`${root}/api/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          isCompleted: true
        })
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 401)

    resp = await handler(
      new Request(`${root}/api/tasks/${task.id}`, {
        method: 'PUT',
        body: '',
        headers,
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 400);

    resp = await handler(
      new Request(`${root}/api/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          isCompleted: true
        }),
        headers,
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 200);
  });

  await t.step('delete', async () => {
    resp = await handler(
      new Request(`${root}/api/tasks/${task.id}`, {
        method: 'DELETE',
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 401);

    resp = await handler(
      new Request(`${root}/api/tasks/${task.id}`, {
        method: 'DELETE',
        headers
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 200);
  });
});
