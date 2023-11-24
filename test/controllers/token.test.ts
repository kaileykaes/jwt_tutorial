import { Token } from '../../controllers/token.ts';
import { assertEquals, assertRejects, assertThrows } from '$std/assert/mod.ts';
import { key } from '../../utils/apiKey.ts';

Deno.test('Token', async () => {
  assertThrows(() => {
    // @ts-ignore: Coverage
    new Token({});
  });
  const t = new Token({ payload: { name: 'test', roles: [] } });
  const jwt = await t.create(key);
  assertEquals(jwt, await t.create(key));

  assertRejects(async () => {
    // No nbf, etc.
    const j = new Token({ jwt });
    await j.verify(key);
  });
});
