import { monotonicFactory } from 'ulid';
import { kv } from './connectDB.ts';

export type RetryableFunction = () => Promise<
  Deno.KvCommitResult | Deno.KvCommitError
>;

export class Keyed {
  public static root: Deno.KvKey = [];
  public static id = monotonicFactory();
  public static kv = kv;
  public static retries = 5;

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
    return last!;
  }
}
