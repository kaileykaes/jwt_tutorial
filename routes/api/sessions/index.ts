import { Handlers } from '$fresh/server.ts';
import { RefreshToken } from '../../../database/refreshToken.ts';
import { State } from '../../../schema/user.ts';

export const handler: Handlers<any, State> = {
  async GET(_req, ctx) {
    const sessions = await RefreshToken.list(ctx.state.sub!);
    return new Response(JSON.stringify(sessions));
  },
};
