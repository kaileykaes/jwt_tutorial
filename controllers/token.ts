import { create as jwtCreate, type Header, verify as jwtVerify } from 'djwt';
import { State } from '../schema/user.ts';
import { Invalid } from './invalid.ts';

export interface JwtTokenSpecfier {
  jwt: string;
  payload?: undefined;
}
export interface PayloadTokenSpecfier {
  jwt?: undefined;
  payload: State;
}
export type TokenSpecifier = JwtTokenSpecfier | PayloadTokenSpecfier;

/**
 * A JWT from either a string representation or with a payload that needs
 * to be turned into a string.
 */
export class Token {
  #jwt: string | undefined;
  #payload: State | undefined;

  /**
   * @param spec Either a string (jwt) or State (payload).
   */
  constructor(spec: TokenSpecifier) {
    if (spec.jwt) {
      this.#jwt = spec.jwt;
    } else {
      if (!spec.payload) {
        throw new TypeError('Invalid token specifier');
      }
      this.#payload = spec.payload;
    }
  }

  /**
   * Convert the payload to a string.
   *
   * @param key The signing key
   * @returns JWT string
   */
  async create(key: CryptoKey): Promise<string> {
    if (this.#jwt) {
      return this.#jwt;
    }
    // Hack to extrack the "HS256" or "HS512" string from the key's algorithm.
    const alg = `HS${
      (key.algorithm as HmacKeyAlgorithm).length / 2
    }` as Header['alg'];

    this.#jwt = await jwtCreate(
      { alg, typ: 'JWT' },
      this.#payload!,
      key,
    );
    return this.#jwt;
  }

  /**
   * Verify the string version and extract the payload.
   *
   * @param key The verifying key.
   * @returns Promise to payload
   * @throws On invalid token
   */
  async verify(key: CryptoKey): Promise<State> {
    const payload = this.#payload ??
      (await jwtVerify(this.#jwt!, key)) as State;
    this.#payload = payload;

    // Zero always invalid date
    if (
      payload &&
      payload.nbf &&
      payload.exp &&
      payload.sub &&
      payload.jti &&
      Invalid.instance.isValid(payload.jti)
    ) {
      // djwt checks nbf and exp
      return payload;
    }
    throw new Error(`Invalid Token`);
  }
}
