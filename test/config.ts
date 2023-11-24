import { createHandler, type ServeHandlerInfo } from '$fresh/server.ts';
import manifest from '../fresh.gen.ts';
import config from '../fresh.config.ts';

const hostname = '127.0.0.1';
const root = `http://${hostname}`;
const name = 'hildjjlovespie'; // I mean it could be '_____TESTING_____', but...

export const CONN_INFO: ServeHandlerInfo = {
  remoteAddr: { hostname, port: 53496, transport: 'tcp' },
};

export const HANDLER = await createHandler(manifest, config);

let resp: Response | undefined = undefined;

await HANDLER(
  new Request(`${root}/api/users`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      password: 'test',
    }),
  }),
  CONN_INFO,
);

resp = await HANDLER(
  new Request(`${root}/api/sessions`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      password: 'test',
    }),
  }),
  CONN_INFO,
);

export const { userId, token } = await resp!.json();
