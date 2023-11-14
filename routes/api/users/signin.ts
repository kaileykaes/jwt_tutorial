import { Handlers } from '$fresh/server.ts';
import type { State } from '../../../schema/user.ts';
import * as bcrypt from 'bcrypt';
import { key, refreshKey } from '../../../utils/apiKey.ts';
import { RefreshToken } from '../../../database/refreshToken.ts';
import { RefreshTokenSchema } from '../../../schema/refreshToken.ts';
import { Token } from '../../../controllers/token.ts';
import { User } from '../../../database/user.ts';
import {
  AUTH_DURATION,
  CLOCK_SKEW,
  REFRESH_DURATION,
} from '../../../utils/config.ts';

export const handler: Handlers = {
  async POST(req, ctx) {
    let status = 401;
    let statusText = 'Unauthorized';

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
    return new Response(null, {
      status,
      statusText,
    });
  },
};
