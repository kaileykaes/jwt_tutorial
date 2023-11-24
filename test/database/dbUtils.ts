import {
  assertSpyCalls,
  mockSessionAsync,
  type Stub,
  stub,
} from '$std/testing/mock.ts';

// Make the next call to commit() look like it failed, even though it didn't.
// The goal is to not leave an AtomicOperation hanging.  AtomicOperation should
// have a cancel() method that we would prefer to use instead.
export async function failCommit(
  fn: () => Promise<Error>,
  times = 1,
): Promise<void> {
  await mockSessionAsync(async (): Promise<Error> => {
    // All no-ops, with a fail at the end
    const stubs: Record<string, Stub> = {
      check: stub(
        Deno.AtomicOperation.prototype,
        'check',
        function (..._checks: Deno.AtomicCheck[]): Deno.AtomicOperation {
          return this;
        },
      ),
      mutate: stub(
        Deno.AtomicOperation.prototype,
        'mutate',
        function (..._mutations: Deno.KvMutation[]): Deno.AtomicOperation {
          return this;
        },
      ),
      sum: stub(
        Deno.AtomicOperation.prototype,
        'sum',
        function (_key: Deno.KvKey, _n: bigint): Deno.AtomicOperation {
          return this;
        },
      ),
      min: stub(
        Deno.AtomicOperation.prototype,
        'min',
        function (_key: Deno.KvKey, _n: bigint): Deno.AtomicOperation {
          return this;
        },
      ),
      max: stub(
        Deno.AtomicOperation.prototype,
        'max',
        function (_key: Deno.KvKey, _n: bigint): Deno.AtomicOperation {
          return this;
        },
      ),
      set: stub(
        Deno.AtomicOperation.prototype,
        'set',
        function (
          _key: Deno.KvKey,
          _value: unknown,
          _options?: { expireIn?: number },
        ) {
          return this;
        },
      ),
      delete: stub(
        Deno.AtomicOperation.prototype,
        'delete',
        function (_key: Deno.KvKey) {
          return this;
        },
      ),
      enqueue: stub(
        Deno.AtomicOperation.prototype,
        'enqueue',
        function (
          _value: unknown,
          _options?: { delay?: number; keysIfUndelivered?: Deno.KvKey[] },
        ) {
          return this;
        },
      ),
      commit: stub(
        Deno.AtomicOperation.prototype,
        'commit',
        function (): Promise<Deno.KvCommitError> {
          return Promise.resolve({ ok: false });
        },
      ),
    };

    const res = await fn();
    assertSpyCalls(stubs.commit, times);
    return res;
  })();
}
