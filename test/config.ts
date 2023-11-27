import { createHandler, type ServeHandlerInfo } from '$fresh/server.ts';
import manifest from '../fresh.gen.ts';
import config from '../fresh.config.ts';

export const hostname = '127.0.0.1';
export const root = `http://${hostname}`;
const name = 'hildjjlovespie'; // I mean it could be '_____TESTING_____', but...

const CONN_INFO: ServeHandlerInfo = {
  remoteAddr: { hostname, port: 53496, transport: 'tcp' },
};

const HANDLER = await createHandler(manifest, config);

export interface SessionInfo {
  name: string;
  userId: string;
  token: string;
  handle: (req: Request) => Promise<Response>;
}
export async function withSession(
  fn: (session: SessionInfo) => Promise<void>,
): Promise<void> {
  const handle = (req: Request) => HANDLER(req, CONN_INFO);

  // Create user
  await handle(
    new Request(`${root}/api/users`, {
      method: 'POST',
      body: JSON.stringify({
        name,
        password: 'test',
      }),
    }),
  );

  const resp = await handle(
    new Request(`${root}/api/sessions`, {
      method: 'POST',
      body: JSON.stringify({
        name,
        password: 'test',
      }),
    }),
  );
  const { userId, token } = await resp!.json();

  try {
    // Actually run the tests
    await fn({ name, userId, token, handle });
  } finally {
    // Delete user and sessions as side-effect
    await handle(
      new Request(`${root}/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          password: 'test',
        }),
      }),
    );
  }
}
