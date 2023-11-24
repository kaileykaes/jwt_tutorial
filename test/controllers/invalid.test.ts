import { assertEquals } from '$std/assert/mod.ts';
import { FakeTime } from '$std/testing/time.ts';
import { Invalid } from '../../controllers/invalid.ts';
import { RefreshToken } from '../../database/refreshToken.ts';

await Deno.test('Invalid', (_t): void => {
  const time = new FakeTime();
  try {
    const inv = new Invalid({ timeout: 500, duration: 900 }).start();
    const id = RefreshToken.id();
    inv.invalidate(id);
    inv.invalidate(RefreshToken.id());
    assertEquals(inv.size(), 2);
    // expire() fires twice: once where we have nothing to do, once where
    // we do the expiry.
    time.tick(1005);
    assertEquals(inv.size(), 0);
    // The original id has expired by now.
    assertEquals(inv.invalidate(id), -Infinity);
    inv.stop();
  } finally {
    time.restore();
  }
});
