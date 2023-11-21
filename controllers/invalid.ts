import { assertEquals } from '$std/assert/assert_equals.ts';
import { decodeTime } from 'ulid';
import { AUTH_DURATION, LOGOUT_EXPIRY } from '../utils/config.ts';
import { Heap } from 'heap-js';

interface HeapEntry {
  id: string;
  expires: number;
}

export interface InvalidConfig {
  /**
   * How often to eject unneeded entries from the list, in ms.
   * @default LOGOUT_EXPIRY
   */
  timeout?: number;
  /**
   * How long items should persist in the list, in ms.
   * @default AUTH_DURATION * 1000
   */
  duration?: number;
}

/**
 * A list of invalid JWT tokens by jti.  When logging out, put tokens in this
 * list to ensure they are no longer used.  Tokens will be removed from the
 * list after they expire.
 *
 * This list will include tokens from logout (all current tokens invalidated),
 * as well as from refresh (the auth tokens will still have some time left).
 * The first set is probably small, even in prod.  The second set is likely
 * quite large, but let's store it in memory for the moment.  When we run out
 * of memory the first time, this will be the thing that is the problem.
 *
 * In prod, we would really like to invalidate auth tokens across the
 * cluster, without having to do a database hit for each authorization.  We
 * could do something interesting with pub/sub, perhaps, but be careful of
 * opening up a DoS attack where someone logs in and out a bunch, or creates a
 * bunch of accounts then logs them all out.
 */
export class Invalid {
  // Global instance
  static instance = new Invalid().start();

  #timeout: number;
  #duration: number;
  #set = new Set<string>();
  #heap = new Heap<HeapEntry>(Invalid.#compareEntries);
  #timer = 0;

  constructor(config?: InvalidConfig) {
    this.#timeout = config?.timeout ?? LOGOUT_EXPIRY;
    this.#duration = config?.duration ?? AUTH_DURATION * 1000;
  }

  static #compareEntries(a: HeapEntry, b: HeapEntry): number {
    return a.expires - b.expires;
  }

  /**
   * Begin the expiry tick.  Fires every duration ms, looking for entries
   * to eject.
   *
   * @returns this
   */
  start(): Invalid {
    this.stop();
    this.#timer = setInterval(() => this.expire(), this.#timeout);
    // Don't block shutdown with timer.
    Deno.unrefTimer(this.#timer);
    return this;
  }

  /**
   * Stops the expiry tick.
   *
   * @returns this
   */
  stop(): Invalid {
    clearInterval(this.#timer);
    this.#timer = 0;
    return this;
  }

  /**
   * Is the given token id not known to be invalid?
   *
   * @param id The jti for a token pair
   * @returns
   */
  isValid(id: string): boolean {
    return !this.#set.has(id);
  }

  /**
   * Mark the given token as invalid for a while.
   *
   * @param id The jti for a token pair.  MUST be a valid ULID.
   * @returns
   */
  invalidate(id: string): number {
    // Ignore expiry, since it will often be for the refresh token. We will
    // extract the time from the id, and add the AUTH_DURATION. That should
    // keep the item in the heap for at most AUTH_DURATION + CLOCK_SKEW
    // seconds.

    const entry: HeapEntry = {
      id,
      expires: decodeTime(id) + this.#duration,
    };
    if (entry.expires > new Date().getTime()) {
      this.#heap.push(entry);
      this.#set.add(id);
      return entry.expires;
    }
    return -Infinity;
  }

  /**
   * Check the list of entries to see which tokens have expired, so are no safe
   * to not track any more.  Works from the onese shose expiry time is the
   * closest to now, towards less-likely-to-expire tokens.
   *
   * Runs in a timer loop if start() is called.  The global instance has had
   * start() called on it.
   *
   * @returns The number of tokens evicted from the list.
   */
  expire(): number {
    const now = new Date().getTime();
    let count = 0;
    let entry: HeapEntry | undefined = undefined;

    // Pull entries off the Heap until we find one that hasn't expired.
    while ((entry = this.#heap.peek())) {
      if (entry.expires < now) {
        this.#set.delete(entry.id);
        this.#heap.pop();
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  size(): number {
    assertEquals(this.#heap.length, this.#set.size);
    return this.#set.size;
  }
}
