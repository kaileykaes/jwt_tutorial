import { Keyed } from '../../database/keyed.ts';

Deno.test('Keyed', () => {
  // deno-lint-ignore require-await
  Keyed.retry(async () => {
    return { ok: false };
  });
});
