import { Handlers, HandlerContext, Status } from "$fresh/server.ts";
import db from '../../../database/connectBD.ts';
import { UserSchema } from '../../../schema/user.ts';
import { create } from 'djwt';
import * as bcrypt from 'bcrypt';
import { key } from '../../../utils/apiKey.ts';
import { authorized } from '../../../middlewares/isAuthorized.ts';
import { isErrorStatus } from 'https://deno.land/std@0.200.0/http/http_status.ts';

const users = db.collection<UserSchema>('users');

export const handler:Handlers<UserSchema | null> = {
  async POST(req: Request, ctx: HandlerContext<UserSchema | null>) {
    const {username, password} = await req.json();

    const user = await users.findOne({ username });

    if (!user) {
      return new Response(`user "${username}" not found`, {
        status: 404,
        statusText: 'Resource not found'
      });
    };
    // TODO(kaileykaes): better error
    const confirmPassword = await bcrypt.compare(password, user.password);
    if (!confirmPassword) {
      return new Response(`Bad credentials`, {
        status: 401,
        statusText: 'Unauthorized'
      });
    };

    //authenticate a user
    const payload = {
      id: user._id,
      name: username
    };

    const jwt = await create({ alg: 'HS512', typ: 'JWT' }, { payload }, key);

    if (jwt) {
      const body = {
        userId: user._id,
        username: user.username,
        token: jwt,
      };
      console.log(4, ctx.render)
      return new Response(JSON.stringify(body));
    } else {
      // research & add error handling for response status here too
      const body = {
        message: 'internal server error',
      };
    return new Response(JSON.stringify(body));
    };
  }
};
