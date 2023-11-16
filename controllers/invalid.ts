import { State } from '../schema/user.ts';
import { LOGOUT_EXPIRY } from '../utils/config.ts';

/**
 * A list of invalid JWT tokens by jti.  When logging out, put tokens in this
 * list to ensure they are no longer used.  Tokens will be removed from the
 * list after they expire.
 *
 * The hope is that this list will be quite small, even in prod.  In prod,
 * however, we would really like to invalidate auth tokens across the cluster,
 * without having to do a database hit for each authorization.  We could do
 * something interesting with pub/sub, perhaps, but be careful of opening up a
 * DoS attack where someone logs in and out a bunch, or creates a bunch of
 * accounts then logs them all out.
 */
export class Invalid {
  // Global instance
  static instance = new Invalid(LOGOUT_EXPIRY);

  #expiry: number;
  #map = new Map<string, number>();
  #timer = 0;

  constructor(expiry: number) {
    this.#expiry = expiry;
    this.start();
  }

  start(): void {
    this.stop();
    this.#timer = setInterval(() => this.expire(), this.#expiry);
  }

  stop(): void {
    clearInterval(this.#timer);
    this.#timer = 0;
  }

  // Mostly for testing, I think.
  [Symbol.dispose](): void {
    this.stop();
    // The map should deallocate right after this, no need to clear it.
  }

  isValid(state: State): boolean {
    if (!state.jti) {
      return false;
    }
    return !this.#map.has(state.jti);
  }

  invalidate(state: State): void {
    if (!state.jti || !state.exp) {
      throw new Error('Invalid token state');
    }
    this.#map.set(state.jti, state.exp);
  }

  expire(): number {
    const now = new Date().getTime();
    let count = 0;
    for (const [k, v] of this.#map.entries()) {
      if (v > now) {
        this.#map.delete(k);
        count++;
      }
    }
    return count;
  }
}
