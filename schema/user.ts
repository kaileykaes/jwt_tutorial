import { ObjectId } from 'mongo';

export interface UserSchema {
  _id?: ObjectId;
  username: string;
  password: string;
}
