import { HandlerContext, Handlers } from '$fresh/server.ts';
import { State } from '../../../schema/user.ts';
import { Task } from '../../../database/task.ts';
import type { TaskSchema } from '../../../schema/task.ts';

export const handler: Handlers = {
  async GET(_req, ctx: HandlerContext<State>) {
    const task = await Task.read(ctx.state.sub, ctx.params.id);
    if (!task) {
      return new Response(null, { status: 404 });
    }
    return new Response(JSON.stringify(task));
  },

  async PUT(req, ctx) {
    const task = await req.json() as TaskSchema;
    const actual = await Task.update(ctx.state.sub, ctx.params.id, task);
    return new Response(JSON.stringify(actual));
  },

  async DELETE(_req, ctx) {
    await Task.delete(ctx.state.sub, ctx.params.id);
    return new Response('{}');
  },
};
