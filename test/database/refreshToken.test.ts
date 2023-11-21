import { assertRejects } from '$std/assert/assert_rejects.ts';
import { RefreshToken } from '../../database/refreshToken.ts';
import type { RefreshTokenSchema } from '../../schema/refreshToken.ts';
import { failCommit } from './dbUtils.ts';

const INCOMPLETE: RefreshTokenSchema = {
  clientIP: '127.0.0.1',
  name: 'test',
  roles: [],
};

const TESTING: RefreshTokenSchema = {
  ...INCOMPLETE,
  jti: RefreshToken.id(),
  sub: '_____TESTING_____',
};

Deno.test('RefreshToken', async (t) => {
  await t.step('create', async () => {
    await assertRejects(
      () => {
        return RefreshToken.create(INCOMPLETE);
      },
      Error,
      'Invalid refresh token',
    );

    const badSub = RefreshToken.id();
    await failCommit(() =>
      assertRejects(
        () =>
          RefreshToken.create({
            ...INCOMPLETE,
            jti: RefreshToken.id(),
            sub: badSub,
          }),
        Error,
        'Database error storing refresh token',
      )
    );

    // Leave this in the kv for refresh
    await RefreshToken.create(TESTING);
  });

  await t.step('refresh', async () => {
    await assertRejects(
      () =>
        RefreshToken.refresh({
          ...INCOMPLETE,
          jti: 'INVALID',
          sub: 'INVALID',
        }, INCOMPLETE),
      Error,
      'Invalid refresh token',
    );

    // Make the final .commit() return an error.
    await failCommit(() =>
      assertRejects(
        () => RefreshToken.refresh(TESTING, TESTING),
        Error,
        'Database error storing refresh token',
      )
    );
  });

  await t.step('logout', async () => {
    await failCommit(() =>
      assertRejects(
        () => RefreshToken.logout(TESTING.sub!),
        Error,
        'Error while deleting',
      )
    );

    await RefreshToken.logout(TESTING.sub!);
  });
});
