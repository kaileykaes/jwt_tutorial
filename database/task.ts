import { kv } from './connectDB.ts';
import { monotonicFactory } from 'ulid';
import { StoredTaskSchema, TaskSchema } from '../schema/task.ts';

const ulid = monotonicFactory();

export class Task {
  static async create(task: TaskSchema): Promise<StoredTaskSchema> {
    const id = task.id ?? ulid();
    const actual: StoredTaskSchema = {
      id,
      userId: task.userId,
      name: task.name,
      isCompleted: task.isCompleted ?? false,
    };

    const res = await kv.atomic()
      .check({ key: ['tasks', task.userId, id], versionstamp: null })
      .set(['tasks', task.userId, id], actual)
      .commit();
    if (!res.ok) {
      throw new TypeError(`Task with id "${task.id}" already exists`);
    }
    return actual;
  }

  static async read(
    userId: string,
    id: string,
  ): Promise<StoredTaskSchema | null> {
    const res = await kv.get<StoredTaskSchema>(['tasks', userId, id]);
    return res.value;
  }

  static async list(userId: string): Promise<StoredTaskSchema[]> {
    const res: StoredTaskSchema[] = [];
    for await (
      const task of kv.list<StoredTaskSchema>({ prefix: ['tasks', userId] })
    ) {
      res.push(task.value);
    }
    return res;
  }

  static async update(userId: string, id: string, task: TaskSchema) {
    const old = await kv.get<StoredTaskSchema>(['tasks', userId, id]);
    if (!old?.value) {
      throw new Error(`Invalid task: "${id}"`);
    }
    const actual = {
      id,
      userId,
      name: task.name ?? old.value.name,
      isCompleted: task.isCompleted ?? old.value.isCompleted,
    };
    await kv.atomic()
      .check(old)
      .set(['tasks', userId, id], actual)
      .commit();
    return actual;
  }

  static delete(userId: string, id: string): Promise<void> {
    return kv.delete(['tasks', userId, id]);
  }
}
