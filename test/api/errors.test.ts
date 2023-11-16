import { createHandler, type ServeHandlerInfo } from '$fresh/server.ts';
import manifest from '../../fresh.gen.ts';
import config from '../../fresh.config.ts';
import { assertEquals } from '$std/assert/mod.ts';

const hostname = '127.0.0.1';
const root = `http://${hostname}`;

const CONN_INFO: ServeHandlerInfo = {
  remoteAddr: { hostname, port: 53496, transport: 'tcp' },
};

await Deno.test('404', async () => {
  const handler = await createHandler(manifest, config);

  const resp = await handler(
    new Request(`${root}/UNKNOWN`, {
      method: 'POST',
    }),
    CONN_INFO,
  );
  assertEquals(resp.status, 404);
});
