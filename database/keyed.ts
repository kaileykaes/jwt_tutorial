import { monotonicFactory } from 'ulid';
import { kv } from './connectDB.ts';

export type RetryableFunction = () => Promise<
  Deno.KvCommitResult | Deno.KvCommitError
>;

/**
 * Base class for DenoKV access.
 */
export class Keyed {
  // Abstract.  Overwrite in child classes
  public static root: Deno.KvKey = [];
  public static retries = 5;
  public static readonly id = monotonicFactory();
  public static readonly kv = kv;

  /**
   * Construct a DenoKV key from the initial part in root, with the given
   * extra segments.
   *
   * @param extra Zero or more extra key segments to add to root.
   * @returns Full key
   */
  static fmtKey(...extra: Deno.KvKeyPart[]) {
    return [...this.root, ...extra];
  }

  /**
   * Retry the given function N times to avoid transient failures.  Transients
   * might include two instances trying to modify the same record at the same
   * time.  Throw an error from the wrapped function if you want to stop
   * retrying.  Return {ok: true} on success.
   *
   * @param fn Function that promises {ok: boolean}.  Most often returns the
   *   result of commit().
   * @returns The result of the last time that fn was called.
   */
  static async retry(
    fn: RetryableFunction,
  ): Promise<Deno.KvCommitResult | Deno.KvCommitError> {
    let last: Deno.KvCommitError | undefined = undefined;
    for (let i = 0; i < this.retries; i++) {
      const res = await fn();
      if (res.ok) {
        return res;
      }
      last = res;
    }
    // retries > 0
    return last!;
  }
}
