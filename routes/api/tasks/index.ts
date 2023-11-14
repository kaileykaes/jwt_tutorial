import { Handlers } from '$fresh/server.ts';
import { Task } from '../../../database/task.ts';
import type { TaskSchema } from '../../../schema/task.ts';
import type { State } from '../../../schema/user.ts';

export const handler: Handlers<TaskSchema, State> = {
  async GET(_req, ctx) {
    const allTasks = await Task.list(ctx.state.sub!);
    return new Response(JSON.stringify(allTasks));
  },

  async POST(req, ctx) {
    const task = await req.json() as TaskSchema;
    try {
      const actual = await Task.create({
        ...task,
        id: undefined,
        userId: ctx.state.sub!,
      });
      return new Response(JSON.stringify(actual));
    } catch {
      return new Response(null, {
        status: 500,
        statusText: 'Internal Server Error',
      });
    }
  },
};
