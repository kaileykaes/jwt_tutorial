import { assertRejects } from '$std/assert/assert_rejects.ts';
import { failCommit } from './dbUtils.ts';
import type { StoredUserSchema } from '../../schema/user.ts';
import { User } from '../../database/user.ts';

Deno.test('User', async (t) => {
  let user: StoredUserSchema | undefined = undefined;

  await t.step('create', async () => {
    // @ts-ignore: testing for bad inputs
    await assertRejects(() => User.create({}));

    // Note: intentionally invalid bcrypt password, so in case this user
    // gets left in by accident, it's not a backdoor.
    user = await User.create({
      name: '_____TESTING_____',
      password: 'test',
    });
  });

  await t.step('update', async () => {
    await assertRejects(
      () =>
        User.update({
          id: 'INVALID',
          name: '_____TESTING_____',
          password: 'test',
          roles: [],
        }),
      Error,
      'Invalid user',
    );

    await assertRejects(
      () =>
        User.update({
          id: user!.id,
          name: 'INVALID',
          password: 'test',
          roles: [],
        }),
      Error,
      'Invalid user',
    );

    await failCommit(
      () => assertRejects(() => User.update(user!), Error, 'Error saving user'),
      5,
    );
  });

  await t.step('delete', async () => {
    await assertRejects(() => User.delete('INVALID'), Error, 'Invalid user');

    await failCommit(
      () =>
        assertRejects(
          () => User.delete(user!.id),
          Error,
          'Error deleting user',
        ),
      5,
    );

    // Delete by hand to cause errors
    await User.kv.delete(User.fmtKey('name', user!.name));

    await assertRejects(() => User.delete(user!.id), Error, 'Invalid user');

    // Clean up the last record by hand.
    await User.kv.delete(User.fmtKey(user!.id));
  });
});
