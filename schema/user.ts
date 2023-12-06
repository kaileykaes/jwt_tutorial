import { Payload } from 'djwt';
import { z } from 'zod';

// On the wire
export interface State extends Payload {
  // sub => id
  // nbf
  // exp
  name: string;
  roles: string[];
}

// In the KV
export interface UserSchema {
  id?: string; // User ID
  name: string;
  roles?: string[];
  password?: string; // bcrypt w/ salt
}

export type StoredUserSchema = Required<UserSchema>;

// In the User API
export const UserAPI = z.object({
  name: z.string().min(3).max(255),
  password: z.string().min(6).max(255),
}).strict();
