import * as bcrypt from 'bcrypt';
import { PASSWORD_SALT_LENGTH } from '../utils/config.ts';

export class UserUtils {
  /**
   * Salt and hash the given password.
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(PASSWORD_SALT_LENGTH);
    return bcrypt.hash(password, salt);
  }

  /**
   * Check the plaintext password against the salted and hashed version.
   *
   * @returns true if valid
   */
  static isPasswordValid(
    plaintext: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(plaintext, hash);
  }
}
