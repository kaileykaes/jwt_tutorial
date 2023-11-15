import { Handlers } from '$fresh/server.ts';
import { User } from '../../../database/user.ts';
import { UserUtils } from '../../../controllers/user.ts';

export const handler: Handlers = {
  async POST(req, _ctx) {
    let status = 400;
    let statusText = '';
    const { name, password } = await req.json();

    try {
      if (!name || (typeof name !== 'string')) {
        statusText = 'Invalid name';
      } else if (!password || (typeof password !== 'string')) {
        statusText = 'Invalid password';
      } else {
        const hashedPassword = await UserUtils.hashPassword(password);

        try {
          const user = await User.create({
            name: name,
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
