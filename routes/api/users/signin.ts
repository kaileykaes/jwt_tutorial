import { Handlers, HandlerContext } from "$fresh/server.ts";
import db from '../../../database/connectBD.ts';
import { UserSchema } from '../../../schema/user.ts';
import { create } from 'djwt';
import * as bcrypt from 'bcrypt';
import { key } from '../../../utils/apiKey.ts';

const users = db.collection<UserSchema>('users');

export const handler:Handlers<UserSchema | null> = {
  async POST(req: Request, _ctx: HandlerContext<UserSchema | null>) {
    const {username, password} = await req.json();

    const user = await users.findOne({ username });

    if (!user) {
      return new Response(JSON.stringify({message: `User "${username}" not found`}), {
        status: 404,
        statusText: 'Resource not found'
      });
    };
    const confirmPassword = await bcrypt.compare(password, user.password);
    if (!confirmPassword) {
      return new Response(JSON.stringify({message: 'Bad credentials'}), {
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
        username: user.username,
        userId: user._id,
        token: jwt,
      };
      return new Response(JSON.stringify(body));
    } else {
      return new Response(JSON.stringify({message: "I'm a teapot"}), {
        status: 418,
        statusText: "I'm a teapot"
      });
    };
  }
};
