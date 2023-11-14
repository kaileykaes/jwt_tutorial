import { StoredUserSchema, UserSchema } from '../schema/user.ts';
import { Keyed } from './keyed.ts';

export class User extends Keyed {
  static async create(state: UserSchema): Promise<StoredUserSchema> {
    if (!state.password || !state.name) {
      throw new RangeError('Password required for user');
    }

    const id = state.id ?? this.id();
    const actual: StoredUserSchema = {
      id,
      name: state.name,
      roles: state.roles ?? [],
      password: state.password,
    };

    // TODO(hildjj): ensure no user names are on the block list (e.g. "root")
    const res = await this.kv.atomic()
      .check({ key: ['users', id], versionstamp: null })
      .check({ key: ['users', 'name', state.name], versionstamp: null })
      .set(['users', id], actual)
      .set(['users', 'name', state.name], actual)
      .commit();
    if (!res.ok) {
      throw new TypeError(`User with name "${state.name}" already exists`);
    }
    return actual;
  }

  static async readByName(name: string): Promise<StoredUserSchema | null> {
    const res = await this.kv.get<StoredUserSchema>(['users', 'name', name]);
    return res.value;
  }
}
