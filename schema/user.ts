import { Payload } from 'djwt';

// On the wire
export interface State extends Payload {
  // sub => id
  // name
  // nbf
  // exp
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
