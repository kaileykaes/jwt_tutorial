import { Handlers, HandlerContext } from "$fresh/server.ts";
import db from '../../../database/connectBD.ts';
import { UserSchema } from '../../../schema/user.ts';
import { create } from 'djwt';
import * as bcrypt from 'bcrypt';
import { key } from '../../../utils/apiKey.ts';

const users = db.collection<UserSchema>('users');

export const handler:Handlers<UserSchema | null> = {
  async POST(req: Request, ctx: HandlerContext<UserSchema | null>) {
    const {username, password} = await req.json();
    if (!username || !password) {
      // TODO(kaileykaes): better error
      throw new Error("Invalid request")
    }
    const user = await users.findOne({ username });

    if (!user) {
      const body = { message: `user "${username}" not found` };
      return new Response(JSON.stringify(body));
    };

    const confirmPassword = await bcrypt.compare(password, user.password);

    if (!confirmPassword) {
      // research & add error handling for response status (currently 200) EEP!
      const body = { message: 'Incorrect password' };
      return new Response(JSON.stringify(body));
    };

    //authenticate a user
    const payload = {
      id: user._id,
      name: username,
    };

    const jwt = await create({ alg: 'HS512', typ: 'JWT' }, { payload }, key);

    if (jwt) {
      const body = {
        userId: user._id,
        username: user.username,
        token: jwt,
      };
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
