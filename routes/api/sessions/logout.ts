import { Handlers } from '$fresh/server.ts';
import { RefreshToken } from '../../../database/refreshToken.ts';
import { State } from '../../../schema/user.ts';

export const handler: Handlers<any, State> = {
  async POST(_req, ctx) {
    const count = await RefreshToken.logout(ctx.state.sub!);
    return new Response(JSON.stringify(count));
  },
};
