import type { Handlers } from '$fresh/server.ts';
import { RefreshToken } from '../../../database/refreshToken.ts';
import type { State } from '../../../schema/user.ts';
import type { StoredUserSchema } from '../../../schema/user.ts';
import { User } from '../../../database/user.ts';
import { UserUtils } from '../../../controllers/user.ts';

export const handler: Handlers<Response, State> = {
  // Change password
  async PUT(req, ctx): Promise<Response> {
    let status = 400;
    let statusText = '';

    try {
      const { password } = await req.json();
      if (!password || (typeof password !== 'string')) {
        statusText = 'Invalid password';
      } else {
        try {
          const u: StoredUserSchema = {
            id: ctx.state.sub!,
            name: ctx.state.name,
            roles: ctx.state.roles,
            password: await UserUtils.hashPassword(password),
          };

          await User.update(u);
          await RefreshToken.logout(u.id);
          return new Response(JSON.stringify({ id: u.id, name: u.name }));
        } catch {
          status = 500;
          statusText = 'Internal Server Error';
        }
      }
    } catch {
      // Ignore for 400
    }

    return new Response(null, {
      status,
      statusText,
    });
  },

  async DELETE(_req, ctx): Promise<Response> {
    if (ctx.params.id !== ctx.state.sub) {
      return new Response(null, {
        status: 401,
        statusText: 'Not authorized',
      });
    }
    try {
      await User.delete(ctx.params.id);
      await RefreshToken.logout(ctx.params.id);
    } catch {
      return new Response(null, {
        status: 400,
        statusText: 'Bad request',
      });
    }
    return new Response(JSON.stringify(ctx.params.id));
  },
};
