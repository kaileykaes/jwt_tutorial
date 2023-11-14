import { REFRESH_DURATION } from '../utils/config.ts';
import { RefreshTokenSchema } from '../schema/refreshToken.ts';
import { Keyed } from './keyed.ts';

export class RefreshToken extends Keyed {
  public static root: Deno.KvKey = ['refresh'];

  static async create(state: RefreshTokenSchema) {
    const key = this.fmtKey(state.sub!, state.jti!);
    const res = await this.kv.atomic()
      .check({ key, versionstamp: null })
      .set(key, state, { expireIn: REFRESH_DURATION * 1000 })
      .commit();
    if (!res.ok) {
      // This should be hard to make happen, since you can't pass an id in.
      throw new Error('Invalid refresh token');
    }
    return state;
  }

  static async refresh(
    previous: RefreshTokenSchema,
    next: RefreshTokenSchema,
  ): Promise<RefreshTokenSchema> {
    const oldKey = this.fmtKey(previous.sub!, previous.jti!);
    const old = await this.kv.get(oldKey);
    if (!old?.value) {
      // Already used
      throw new Error(`Invalid refresh token`);
    }

    const token: RefreshTokenSchema = { ...next, jti: this.id() };
    const key = this.fmtKey(token.sub!, token.jti!);

    const res = await this.kv.atomic()
      .check(old)
      .delete(oldKey)
      .set(key, token, { expireIn: REFRESH_DURATION * 1000 })
      .commit();
    if (!res.ok) {
      // This one should be difficult to make happen
      throw new Error('Invalid refresh token');
    }

    return token;
  }

  static async logout(userId: string): Promise<number> {
    let txn = this.kv.atomic();
    let count = 0;
    for await (const tok of this.kv.list({ prefix: ['refresh', userId] })) {
      txn = txn.delete(tok.key);
      count++;
    }
    const res = await txn.commit();
    if (!res.ok) {
      throw new Error('Error while deleting');
    }
    return count;
  }

  static async list(userId: string): Promise<RefreshTokenSchema[]> {
    const res: RefreshTokenSchema[] = [];
    for await (
      const task of this.kv.list<RefreshTokenSchema>({
        prefix: this.fmtKey(userId),
      })
    ) {
      res.push(task.value);
    }
    return res;
  }
}
