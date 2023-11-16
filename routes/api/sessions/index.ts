import { Handlers } from '$fresh/server.ts';
import { RefreshToken } from '../../../database/refreshToken.ts';
import { State } from '../../../schema/user.ts';
import * as bcrypt from 'bcrypt';
import { key, refreshKey } from '../../../utils/apiKey.ts';
import { RefreshTokenSchema } from '../../../schema/refreshToken.ts';
import { Token } from '../../../controllers/token.ts';
import { User } from '../../../database/user.ts';
import {
  AUTH_DURATION,
  CLOCK_SKEW,
  REFRESH_DURATION,
} from '../../../utils/config.ts';

export const handler: Handlers<Response, State> = {
  async GET(_req, ctx): Promise<Response> {
    const sessions = await RefreshToken.list(ctx.state.sub!);
    return new Response(JSON.stringify(sessions));
  },

  // Not authorized
  async POST(req, ctx): Promise<Response> {
    let status = 401;
    let statusText = 'Unauthorized';

    try {
      const { name, password } = await req.json();
      if (name && password) {
        const user = await User.readByName(name);
        if (user) {
          if (await bcrypt.compare(password, user.password)) {
            const now = Math.round(new Date().valueOf() / 1000) - CLOCK_SKEW;
            const payload: State = {
              jti: RefreshToken.id(), // For both tokens in the pair
              iss: new URL('/', req.url).toString(),
              sub: user.id,
              name: user.name,
              roles: user.roles,
              nbf: now,
              exp: now + AUTH_DURATION,
            };

            const authToken = await new Token({ payload }).create(key);
            const refreshPayload: RefreshTokenSchema = {
              ...payload,
              clientIP: ctx.remoteAddr.hostname,
              exp: now + REFRESH_DURATION,
            };
            const refreshToken = await new Token({ payload: refreshPayload })
              .create(refreshKey);

            await RefreshToken.create(refreshPayload);

            if (authToken && refreshToken) {
              return new Response(JSON.stringify({
                name: user.name,
                userId: user.id,
                token: authToken,
                duration: AUTH_DURATION,
                refreshToken,
                refreshDuration: REFRESH_DURATION,
              }));
            }

            status = 500;
            statusText = 'Internal server erorr';
          }
        }
      }
    } catch (_er) {
      status = 400;
      statusText = 'Bad request';
    }

    return new Response(null, {
      status,
      statusText,
    });
  },

  // Not authorized
  async PUT(req, _ctx): Promise<Response> {
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

  // Log out
  async DELETE(_req, ctx): Promise<Response> {
    const count = await RefreshToken.logout(ctx.state.sub!);
    return new Response(JSON.stringify(count));
  },
};
