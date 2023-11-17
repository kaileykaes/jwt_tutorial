import { MiddlewareHandlerContext } from '$fresh/server.ts';
import { key } from '../utils/apiKey.ts';
import { State } from '../schema/user.ts';
import { Token } from '../controllers/token.ts';

export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext<State>,
) {
  const status = 401;
  try {
    const authorization = req.headers.get('Authorization');
    if (authorization) {
      const jwt = authorization.split(' ')[1];
      ctx.state = await new Token({ jwt }).verify(key);
      return ctx.next();
    }
  } catch {
    // All errors return 401 to hide information from attackers
  }

  return new Response('Unauthorized', { status });
}
