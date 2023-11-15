import {
  AUTH_DURATION,
  CLOCK_SKEW,
  REFRESH_DURATION,
} from '../../../utils/config.ts';
import { Handlers } from '$fresh/server.ts';
import { key, refreshKey } from '../../../utils/apiKey.ts';
import { RefreshToken } from '../../../database/refreshToken.ts';
import { Token } from '../../../controllers/token.ts';
import { RefreshTokenSchema } from '../../../schema/refreshToken.ts';
import { State } from '../../../schema/user.ts';

export const handler: Handlers = {
  async POST(req, _ctx) {
    try {
      const { refreshToken } = await req.json();

      const prev = await (new Token({ jwt: refreshToken }).verify(
        refreshKey,
      )) as RefreshTokenSchema;
      const now = Math.round(new Date().valueOf() / 1000) - CLOCK_SKEW;
      let next: RefreshTokenSchema = {
        ...prev,
        jti: RefreshToken.id(),
        nbf: now,
        exp: now + REFRESH_DURATION,
      };

      next = await RefreshToken.refresh(prev, next);
      const nextRefresh =
        await (new Token({ payload: next }).create(refreshKey));

      const payload: State = {
        jti: next.jti, // For both tokens in the pair
        iss: next.iss,
        sub: next.sub,
        name: next.name,
        roles: next.roles,
        nbf: now,
        exp: now + AUTH_DURATION,
      };
      const nextAuth = await (new Token({ payload }).create(key));

      // Check refresh token for validity
      // Ensure refresh token is in db, delete it
      // Issue new auth
      return new Response(JSON.stringify({
        name: prev.name,
        userId: prev.sub,
        token: nextAuth,
        duration: AUTH_DURATION,
        refreshToken: nextRefresh,
        refreshDuration: REFRESH_DURATION,
      }));
    } catch {
      return new Response(null, {
        status: 401,
        statusText: 'Not Authorized',
      });
    }
  },
};
