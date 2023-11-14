import { HandlerContext, Handlers } from '$fresh/server.ts';
import { Task } from '../../../database/task.ts';
import type { TaskSchema } from '../../../schema/task.ts';
import type { State } from '../../../schema/user.ts';

export const handler: Handlers<Task | null> = {
  async GET(_req, ctx: HandlerContext<State>) {
    const allTasks = await Task.list(ctx.state.sub);
    return new Response(JSON.stringify(allTasks));
  },

  async POST(req, ctx: HandlerContext<State>) {
    const task = await req.json() as TaskSchema;
    try {
      const actual = await Task.create({
        ...task,
        id: undefined,
        userId: ctx.state.sub as string,
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
