import { assertEquals } from '$std/assert/mod.ts';
import { withSession } from '../config.ts';
import { failCommit } from '../database/dbUtils.ts';

const hostname = '127.0.0.1';
const root = `http://${hostname}`;

await Deno.test('Tasks', async (t) => {
  await withSession(async ({ userId, token, handle }) => {
    let resp: Response | undefined = undefined;
    const headers = {
      'Authorization': `bearer ${token}`,
    };

    await t.step('create', async () => {
      resp = await handle(
        new Request(`${root}/api/tasks`, {
          method: 'POST',
          body: '',
        }),
      );
      assertEquals(resp.status, 401);

      resp = await handle(
        new Request(`${root}/api/tasks`, {
          method: 'POST',
          body: '',
          headers,
        }),
      );
      assertEquals(resp.status, 400);

      resp = await handle(
        new Request(`${root}/api/tasks`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: 'Wash the cats',
          }),
        }),
      );
      assertEquals(resp.status, 200);
    });

    const task = await resp!.json();

    await t.step('get tasks', async () => {
      resp = await handle(
        new Request(`${root}/api/tasks`, {
          method: 'GET',
        }),
      );
      assertEquals(resp.status, 401);

      resp = await handle(
        new Request(`${root}/api/tasks`, {
          method: 'GET',
          headers,
        }),
      );
      assertEquals(resp.status, 200);

      await failCommit(async () => {
        resp = await handle(
          new Request(`${root}/api/tasks`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              name: 'Wash the cats',
            }),
          }),
        );
        assertEquals(resp.status, 500);
        return new Error('Error to make type checking happy');
      });
    });

    await t.step('single task', async () => {
      resp = await handle(
        new Request(`${root}/api/tasks/${task.id}`, {
          method: 'GET',
        }),
      );
      assertEquals(resp.status, 401);

      resp = await handle(
        new Request(`${root}/api/tasks/${crypto.randomUUID()}`, {
          method: 'GET',
          headers,
        }),
      );
      assertEquals(resp.status, 404);

      resp = await handle(
        new Request(`${root}/api/tasks/${task.id}`, {
          method: 'GET',
          headers,
        }),
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
      resp = await handle(
        new Request(`${root}/api/tasks/${task.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            isCompleted: true,
          }),
        }),
      );
      assertEquals(resp.status, 401);

      resp = await handle(
        new Request(`${root}/api/tasks/${task.id}`, {
          method: 'PUT',
          body: '',
          headers,
        }),
      );
      assertEquals(resp.status, 400);

      resp = await handle(
        new Request(`${root}/api/tasks/${task.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            isCompleted: true,
          }),
          headers,
        }),
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
      resp = await handle(
        new Request(`${root}/api/tasks/${task.id}`, {
          method: 'DELETE',
        }),
      );
      assertEquals(resp.status, 401);

      resp = await handle(
        new Request(`${root}/api/tasks/${task.id}`, {
          method: 'DELETE',
          headers,
        }),
      );
      assertEquals(resp.status, 200);
      assertEquals(await resp.json(), {});
    });
  });
});

// This is a comment to verify I have signed commits working.
