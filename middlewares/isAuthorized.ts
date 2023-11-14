import { MiddlewareHandlerContext } from '$fresh/server.ts';
import { verify } from 'djwt';
import { key } from '../utils/apiKey.ts';
import { State } from '../schema/user.ts';

export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext<State>,
) {
  let status = 401;
  try {
    const authorization = req.headers.get('Authorization');
    if (authorization) {
      const jwt = authorization.split(' ')[1];
      const payload = await verify(jwt, key) as State;
      // Zero always invalid date
      if (payload && payload.nbf && payload.exp && payload.sub) {
        const now = new Date();
        const nbfDate = new Date(payload.nbf * 1000);
        const expDate = new Date(payload.exp * 1000);

        // TODO(hildjj): handle clock skew
        if ((nbfDate < now) && (expDate > now)) {
          ctx.state = payload;
          return ctx.next();
        }
      }
    }
  } catch (er) {
    console.error(er);
    status = 500;
  }

  return new Response('Unauthorized', { status });
}
