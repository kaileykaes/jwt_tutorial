import { Handlers } from "$fresh/server.ts";
import db from '../../../database/connectBD.ts';
import { UserSchema } from '../../../schema/user.ts';

const users = db.collection<UserSchema>('users');

export const handler: Handlers<User | null> = {
  async POST(req, _ctx) {
    const {username, password} = (await req.json());
    const salt = await bcrypt.genSalt(8);
    const hashedPassword = await bcrypt.hash(password, salt);

    const _id = await users.insertOne({
      username,
      password: hashedPassword,
    });
    const body = {
      message: 'User created',
      userId: _id,
      user: username };

    return new Response(JSON.stringify(body));
  }
}
