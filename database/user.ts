import { StoredUserSchema, UserSchema } from '../schema/user.ts';
import { Keyed } from './keyed.ts';

export class User extends Keyed {
  public static root: Deno.KvKey = ['users'];

  static async create(state: UserSchema): Promise<StoredUserSchema> {
    if (!state.password || !state.name) {
      throw new RangeError('Password and user required');
    }

    const id = state.id ?? this.id();
    const actual: StoredUserSchema = {
      id,
      name: state.name,
      roles: state.roles ?? [],
      password: state.password,
    };

    // TODO(hildjj): ensure no user names are on the block list (e.g. "root")
    const idKey = this.fmtKey(id);
    const nameKey = this.fmtKey('name', state.name);
    const res = await this.kv.atomic()
      .check({ key: idKey, versionstamp: null })
      .check({ key: nameKey, versionstamp: null })
      .set(idKey, actual)
      .set(nameKey, actual)
      .commit();
    if (!res.ok) {
      throw new TypeError(`User with name "${state.name}" already exists`);
    }
    return actual;
  }

  static async readByName(name: string): Promise<StoredUserSchema | null> {
    const res = await this.kv.get<StoredUserSchema>(this.fmtKey('name', name));
    return res.value;
  }

  static async update(state: StoredUserSchema): Promise<void> {
    const idKey = this.fmtKey(state.id);
    const nameKey = this.fmtKey('name', state.name);

    const res = await this.retry(async () => {
      const [idRes, nameRes] = await this.kv.getMany([idKey, nameKey]);
      if (!idRes || !nameRes) {
        throw new Error(`Invalid user "${state.id}"`);
      }

      return this.kv.atomic()
        .check(idRes)
        .check(nameRes)
        .set(idKey, state)
        .set(nameKey, state)
        .commit();
    });

    if (!res.ok) {
      throw new Error(`Error saving user "${state.id}"`);
    }
  }

  static async delete(id: string): Promise<void> {
    const idKey = this.fmtKey(id);

    const res = await this.retry(async () => {
      const idRes = await this.kv.get<StoredUserSchema>(idKey);
      if (!idRes?.value) {
        throw new Error(`Invalid user "${id}"`);
      }
      const nameKey = this.fmtKey('name', idRes.value.name);
      const nameRes = await this.kv.get<StoredUserSchema>(nameKey);

      if (!nameRes?.value) {
        throw new Error(`Invalid user "${id}"`);
      }

      return this.kv.atomic()
        .check(idRes)
        .check(nameRes)
        .delete(idKey)
        .delete(nameKey)
        .commit();
    });

    if (!res.ok) {
      throw new Error(`Error saving user "${id}"`);
    }
  }
}
