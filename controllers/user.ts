import * as bcrypt from 'bcrypt';
import { PASSWORD_SALT_LENGTH } from '../utils/config.ts';

export class UserUtils {
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(PASSWORD_SALT_LENGTH);
    return bcrypt.hash(password, salt);
  }
}
