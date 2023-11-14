import { monotonicFactory } from 'ulid';
import { kv } from './connectDB.ts';

export class Keyed {
  public static root: Deno.KvKey = [];
  public static id = monotonicFactory();
  public static kv = kv;

  static fmtKey(...extra: Deno.KvKeyPart[]) {
    return [...this.root, ...extra];
  }
}
