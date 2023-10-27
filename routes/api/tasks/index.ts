import { Handlers } from "$fresh/server.ts";
import db from '../../../database/connectBD.ts';
import { TaskSchema } from '../../../schema/task.ts';

const tasks = db.collection<TaskSchema>('tasks');

export const handler: Handlers<Task | null> = {
  async GET(_req, _ctx) {
    const allTasks = await tasks.find({}).toArray();
    const body = { tasks: allTasks }
    return new Response(JSON.stringify(body));
  },

  async POST(req, _ctx) {
    const task = (await req.json()) as Task
    const body = {
      message: 'Task created!',
      name: task.name,
      Completed: task.isCompleted,
    };
    return new Response(JSON.stringify(body))
  }
};
