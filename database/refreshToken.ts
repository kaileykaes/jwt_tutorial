import { Invalid } from '../controllers/invalid.ts';
import { Keyed } from './keyed.ts';
import { REFRESH_DURATION } from '../utils/config.ts';
import { RefreshTokenSchema } from '../schema/refreshToken.ts';

/**
 * Database operations for refresh tokens.  As a side-effect, tracks all
 * deleted tokens in the global Invalid instance.
 */
export class RefreshToken extends Keyed {
  public static root: Deno.KvKey = ['refresh'];

  /**
   * Insert a refresh token.
   *
   * @returns state, unmodified
   */
  static async create(state: RefreshTokenSchema): Promise<RefreshTokenSchema> {
    if (!state.sub || !state.jti) {
      throw new TypeError('Invalid refresh token');
    }
    const key = this.fmtKey(state.sub, state.jti);
    const res = await this.kv.atomic()
      .check({ key, versionstamp: null })
      .set(key, state, { expireIn: REFRESH_DURATION * 1000 })
      .commit();
    if (!res.ok) {
      throw new Error('Database error storing refresh token');
    }
    return state;
  }

  /**
   * Refresh a refresh token.
   * Side-effect: publishes the token in the global Invalid list.
   *
   * @param previous
   * @param next
   * @returns
   */
  static async refresh(
    previous: RefreshTokenSchema,
    next: RefreshTokenSchema,
  ): Promise<RefreshTokenSchema> {
    // No need to retry this.  If another process has deleted it, it's gone.
    const oldKey = this.fmtKey(previous.sub!, previous.jti!);
    const old = await this.kv.get<RefreshTokenSchema>(oldKey);
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
      throw new Error('Database error storing refresh token');
    }

    // This is a layer violation, but it's convenient.
    Invalid.instance.invalidate(old.value.jti!);

    return token;
  }

  /**
   * Force-logout all sessions for the given user.  Deletes all refresh tokens
   * for that user.
   * Side-effect: Adds all token ID's to the global Invalid list.
   *
   * @param userId
   * @returns
   */
  static async logout(userId: string): Promise<number> {
    let txn = this.kv.atomic();
    let count = 0;
    for await (
      const tok of this.kv.list<RefreshTokenSchema>({
        prefix: ['refresh', userId],
      })
    ) {
      txn = txn.delete(tok.key);
      // This is a layer violation, but it's convenient.
      Invalid.instance.invalidate(tok.value.jti!);
      count++;
    }
    const res = await txn.commit();
    if (!res.ok) {
      throw new Error('Error while deleting');
    }
    return count;
  }

  /**
   * Return a list of all of the refresh tokens for the given user.
   *
   * @param userId
   * @returns
   */
  static async list(userId: string): Promise<RefreshTokenSchema[]> {
    // Although this might be better as an async generator itself,
    // the web API is just going to turn this into an array.  Leave it be.
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
