import { Handlers } from "$fresh/server.ts";
import db from '../../../database/connectBD.ts';
import { TaskSchema } from '../../../schema/task.ts';
import { ObjectId } from 'mongo';

const tasks = db.collection<TaskSchema>('tasks');

export const handler: Handlers<Task | null> = {
  async GET(_req, _ctx) {
    const taskId = _ctx.params.taskId;
    const task = await tasks.findOne({ _id: new ObjectId(taskId) });
    const body = { task: {task}};
    return new Response(JSON.stringify(body));
  },

  async PUT(req, ctx) {
    const taskId = ctx.params.taskId;
    const { name, isCompleted } = await req.body().value;
    const task = await tasks.updateOne({ _id: new ObjectId(taskId) }, {
      $set: { name: name, isCompleted: isCompleted },
    });
    // response.status = 200;
    const body = { message: 'Updated task', task: task };
    return new Response(JSON.stringify(body))
  },

  async DELETE(_req, ctx) {
    const taskId = ctx.params.taskId;
    const task = await tasks.deleteOne({ _id: new ObjectId(taskId) });
    response.status = 200;
    response.body = { message: 'Deleted task', task: task };
  }
}
