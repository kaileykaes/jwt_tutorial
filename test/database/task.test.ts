import { assertRejects } from '$std/assert/assert_rejects.ts';
// import { failCommit } from './dbUtils.ts';
// import type { StoredTaskSchema } from '../../schema/task.ts';
import { Task } from '../../database/task.ts';
import { userId } from '../config.ts';

Deno.test('Task', async (t) => {
  // let task: StoredTaskSchema | undefined = undefined;

  await t.step('create', async () => {
    //@ts-ignore: testing for bad inputs
    await assertRejects(() => Task.create({}));

    task = await Task.create({
      userId: userId,
      name: 'For real though, wash those greasy cats',
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
