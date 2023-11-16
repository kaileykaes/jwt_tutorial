import { monotonicFactory } from 'ulid';
import { kv } from './connectDB.ts';

export type RetryableFunction = () => Promise<
  Deno.KvCommitResult | Deno.KvCommitError
>;

export class Keyed {
  // Abstract.  Overwrite in child classes
  public static root: Deno.KvKey = [];
  public static retries = 5;
  public static readonly id = monotonicFactory();
  public static readonly kv = kv;

  static fmtKey(...extra: Deno.KvKeyPart[]) {
    return [...this.root, ...extra];
  }

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
