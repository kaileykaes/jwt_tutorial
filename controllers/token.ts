import { create as jwtCreate, type Header, verify as jwtVerify } from 'djwt';
import { State } from '../schema/user.ts';

export interface JwtTokenSpecfier {
  jwt: string;
  payload?: undefined;
}
export interface PayloadTokenSpecfier {
  jwt?: undefined;
  payload: State;
}
export type TokenSpecifier = JwtTokenSpecfier | PayloadTokenSpecfier;

export class Token {
  #jwt: string | undefined;
  #payload: State | undefined;

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

  async verify(key: CryptoKey): Promise<State> {
    if (!this.#payload && !this.#jwt) {
      throw new Error('Invalid token state');
    }

    const payload = this.#payload ??
      (await jwtVerify(this.#jwt!, key)) as State;
    this.#payload = payload;

    // Zero always invalid date
    if (payload && payload.nbf && payload.exp && payload.sub) {
      const now = new Date().getTime();
      const nbfDate = payload.nbf * 1000;
      const expDate = payload.exp * 1000;

      if ((nbfDate < now) && (expDate > now)) {
        return payload;
      }
    }
    throw new Error(`Invalid Token`);
  }
}
