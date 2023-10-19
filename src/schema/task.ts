import { ObjectId } from 'mongo';

export interface TaskSchema {
  _id?: ObjectId;
  name: string;
  isCompleted: boolean;
}
