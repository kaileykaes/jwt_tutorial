import { Handlers } from '$fresh/server.ts';
import { User } from '../../../database/user.ts';
import { UserAPI } from '../../../schema/user.ts';
import { UserUtils } from '../../../controllers/user.ts';
import { errMessage } from '../../../utils/zodparse.ts';

export const handler: Handlers = {
  // Create user
  async POST(req, _ctx): Promise<Response> {
    let status = 400;
    let statusText = '';

    try {
      const {name, password} = UserAPI.parse(await req.json());
      try {
        const hashedPassword = await UserUtils.hashPassword(password);

        try {
          const user = await User.create({
            name: name,
            password: hashedPassword,
          });

          return new Response(
            JSON.stringify({ id: user.id, name: user.name }),
          );
        } catch {
          status = 409;
          statusText = 'Duplicate user';
        }
      } catch {
        status = 500;
        statusText = 'Internal server error';
      }
    } catch (er) {
      // Ignore for 400
      statusText = errMessage(er);
    }
    return new Response(JSON.stringify({ statusText }), {
      status,
      statusText,
    });
  },
};
