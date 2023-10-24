import { HandlerContext } from "$fresh/server.ts";
import db from '../../../database/connectBD.ts';
import { TaskSchema } from '../../../schema/task.ts';
import { authorized } from '../../../middlewares/isAuthorized.ts';
import { ObjectId } from 'mongo';

const tasks = db.collection<TaskSchema>('tasks');

export const getTasks = (_req: Request, _ctx: HandlerContext): Response => {
  const allTasks = tasks.find({}).toArray();
  const body = { tasks: allTasks };
  return new Response(JSON.stringify(body));
};

export const createTask = (req: Request, _ctx: HandlerContext): Response => {

};
