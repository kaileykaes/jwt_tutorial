import { assertEquals } from '$std/assert/mod.ts';
import { CONN_INFO, HANDLER, token, userId } from '../config.ts';
import { failCommit } from '../database/dbUtils.ts';
import { User } from '../../database/user.ts';

const hostname = '127.0.0.1';
const root = `http://${hostname}`;

await Deno.test('Tasks', async (t) => {
  let resp: Response | undefined = undefined;

  const headers = {
    'Authorization': `bearer ${token}`,
  };

  await t.step('create', async () => {
    resp = await HANDLER(
      new Request(`${root}/api/tasks`, {
        method: 'POST',
        body: '',
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 401);

    resp = await HANDLER(
      new Request(`${root}/api/tasks`, {
        method: 'POST',
        body: '',
        headers,
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 400);

    resp = await HANDLER(
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
    resp = await HANDLER(
      new Request(`${root}/api/tasks`, {
        method: 'GET',
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 401);

    resp = await HANDLER(
      new Request(`${root}/api/tasks`, {
        method: 'GET',
        headers,
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 200);

    await failCommit(async () => {
      resp = await HANDLER(
        new Request(`${root}/api/tasks`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: 'Wash the cats',
          }),
        }),
        CONN_INFO,
      );
      assertEquals(resp.status, 500);
      return new Error('Error to make type checking happy');
    });
  });

  await t.step('single task', async () => {
    resp = await HANDLER(
      new Request(`${root}/api/tasks/${task.id}`, {
        method: 'GET',
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 401);

    resp = await HANDLER(
      new Request(`${root}/api/tasks/${crypto.randomUUID()}`, {
        method: 'GET',
        headers,
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 404);

    resp = await HANDLER(
      new Request(`${root}/api/tasks/${task.id}`, {
        method: 'GET',
        headers,
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 200);
    assertEquals(await resp.json(), {
      id: task.id,
      userId: userId,
      name: task.name,
      isCompleted: task.isCompleted,
    });
  });

  await t.step('update', async () => {
    resp = await HANDLER(
      new Request(`${root}/api/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          isCompleted: true,
        }),
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 401);

    resp = await HANDLER(
      new Request(`${root}/api/tasks/${task.id}`, {
        method: 'PUT',
        body: '',
        headers,
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 400);

    resp = await HANDLER(
      new Request(`${root}/api/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          isCompleted: true,
        }),
        headers,
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 200);
    assertEquals(await resp.json(), {
      id: task.id,
      userId: userId,
      name: task.name,
      isCompleted: true,
    });
  });

  await t.step('delete', async () => {
    resp = await HANDLER(
      new Request(`${root}/api/tasks/${task.id}`, {
        method: 'DELETE',
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 401);

    resp = await HANDLER(
      new Request(`${root}/api/tasks/${task.id}`, {
        method: 'DELETE',
        headers,
      }),
      CONN_INFO,
    );
    assertEquals(resp.status, 200);
    assertEquals(await resp.json(), {});
  });
  await User.kv.delete(User.fmtKey(userId)); // this doesn't actually work
});
