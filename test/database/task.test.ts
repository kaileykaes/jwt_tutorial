import { assertRejects } from '$std/assert/assert_rejects.ts';
import { assert } from '$std/assert/assert.ts';
// import { failCommit } from './dbUtils.ts';
// import type { StoredTaskSchema } from '../../schema/task.ts';
import { Task } from '../../database/task.ts';
import { withSession } from '../config.ts';
import { StoredTaskSchema } from '../../schema/task.ts';

Deno.test('Task', async (t) => {
  // let task: StoredTaskSchema | undefined = undefined;

  await withSession(async ({ userId }) => {
    let task: StoredTaskSchema | undefined = undefined;
    await t.step('create', async () => {
      //@ts-ignore: testing for bad inputs
      await assertRejects(() => Task.create({}));

      task = await Task.create({
        userId: userId,
        name: 'For real though, wash those greasy cats',
      });

      assert(task);
    });

    await t.step('delete', async () => {
      await Task.delete(userId, task!.id);
    });
  });

  // await t.step('update', async () => {
  //   await assertRejects(
  //     () =>
  //       Task.update({
  //         id: 'INVALID',
  //         userId: userId,
  //         name: 'For real though, wash those greasy cats',
  //       }),
  //     Error,
  //     'Invalid task',
  //   );
  // });
});
