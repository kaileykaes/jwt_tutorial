import { HandlerContext, Handlers } from '$fresh/server.ts';
import type { State, UserSchema } from '../../../schema/user.ts';
import { create } from 'djwt';
import * as bcrypt from 'bcrypt';
import { key } from '../../../utils/apiKey.ts';
import { User } from '../../../database/user.ts';

export const handler: Handlers = {
  async POST(req: Request, _ctx: HandlerContext) {
    let status = 401;
    let statusText = 'Unauthorized';

    const { name, password } = await req.json();
    if (name && password) {
      const user = await User.readByName(name);
      if (user) {
        if (await bcrypt.compare(password, user.password)) {
          const now = Math.round(new Date().valueOf() / 1000);
          const payload: State = {
            sub: user.id,
            name: user.name,
            roles: user.roles,
            nbf: now,
            exp: now + 3600, // Good for 1h in seconds
          };

          const token = await create(
            { alg: 'HS256', typ: 'JWT' },
            payload,
            key,
          );
          if (token) {
            return new Response(JSON.stringify({
              name: user.name,
              userId: user.id,
              token,
            }));
          }

          status = 500;
          statusText = 'Internal server erorr';
        }
      }

      return new Response(null, {
        status,
        statusText,
      });
    }
  },
};
