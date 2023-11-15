import type { Handlers } from '$fresh/server.ts';
import { User } from '../../../database/user.ts';
import type { State } from '../../../schema/user.ts';
import { StoredUserSchema } from '../../../schema/user.ts';
import { UserUtils } from '../../../controllers/user.ts';
import { RefreshToken } from '../../../database/refreshToken.ts';

export const handler: Handlers<any, State> = {
  async PUT(req, ctx) {
    let status = 400;
    let statusText = '';
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

    return new Response(null, {
      status,
      statusText,
    });
  },
};
