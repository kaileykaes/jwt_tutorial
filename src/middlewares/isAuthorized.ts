import { Context } from 'oak';
import { key } from '../utils/apiKey.ts';
import { verify } from 'djwt';

export const authorized = async (ctx: Context, next: unknown) => {
  try {
    const headers: Headers = ctx.request.headers;
    const authorization = headers.get('Authorization');
    if (!authorization) {
      ctx.response.status = 401;
      return;
    }

    const jwt = authorization.split(' ')[1];

    if (!jwt) {
      ctx.response.status = 401;
      return;
    }
    const payload = await verify(jwt, key);

    if (!payload) {
      throw new Error('!payload');
    }
    await next();
  } catch (_error) {
    ctx.response.status = 401;
    ctx.response.body = {
      message: 'Sir, that\'ll be a nope. This route isn\'t for you.',
    };
  }
};
