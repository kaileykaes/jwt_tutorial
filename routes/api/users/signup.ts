import { Handlers } from '$fresh/server.ts';
import { User } from '../../../database/user.ts';
import * as bcrypt from 'bcrypt';

export const handler: Handlers = {
  async POST(req, _ctx) {
    let status = 400;
    let statusText = '';
    const { name, password } = await req.json();

    try {
      if (!name) {
        statusText = 'Missing name';
      } else if (!password) {
        statusText = 'Missing password';
      } else {
        const salt = await bcrypt.genSalt(8);
        const hashedPassword = await bcrypt.hash(password, salt);

        try {
          const user = await User.create({
            name: String(name),
            password: hashedPassword,
          });

          return new Response(JSON.stringify({ id: user.id, name: user.name }));
        } catch {
          status = 409;
          statusText = 'Duplicate user';
        }
      }
    } catch {
      status = 500;
      statusText = 'Internal server error';
    }
    return new Response(JSON.stringify({ statusText }), {
      status,
      statusText,
    });
  },
};
