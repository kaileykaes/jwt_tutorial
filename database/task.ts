import { StoredTaskSchema, TaskSchema } from '../schema/task.ts';
import { Keyed } from './keyed.ts';

export class Task extends Keyed {
  public static root: Deno.KvKey = ['tasks'];
  static async create(task: TaskSchema): Promise<StoredTaskSchema> {
    const id = task.id ?? this.id();
    const actual: StoredTaskSchema = {
      id,
      userId: task.userId,
      name: task.name,
      isCompleted: task.isCompleted ?? false,
    };

    const key = this.fmtKey(task.userId, id);
    const res = await this.kv.atomic()
      .check({ key, versionstamp: null })
      .set(key, actual)
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
    const res = await this.kv.get<StoredTaskSchema>(this.fmtKey(userId, id));
    return res.value;
  }

  static async list(userId: string): Promise<StoredTaskSchema[]> {
    const res: StoredTaskSchema[] = [];
    for await (
      const task of this.kv.list<StoredTaskSchema>({
        prefix: this.fmtKey(userId),
      })
    ) {
      res.push(task.value);
    }
    return res;
  }

  static async update(
    userId: string,
    id: string,
    task: TaskSchema
  ): Promise<TaskSchema> {
    const key = this.fmtKey(userId, id);

    let actual: TaskSchema | undefined = undefined;
    const res = await this.retry(async () => {
      const old = await this.kv.get<StoredTaskSchema>(key);
      if (!old?.value) {
        throw new Error(`Invalid task: "${id}"`);
      }
      actual = {
        id,
        userId,
        name: task.name ?? old.value.name,
        isCompleted: task.isCompleted ?? old.value.isCompleted,
      };
      return this.kv.atomic()
        .check(old)
        .set(key, actual)
        .commit();
    });

    if (!res.ok) {
      throw new Error(`Task "${id}" not found`);
    }
    return actual!;
  }

  static delete(userId: string, id: string): Promise<void> {
    return this.kv.delete(this.fmtKey(userId, id));
  }
}
