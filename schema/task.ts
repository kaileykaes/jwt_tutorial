export interface TaskSchema {
  id?: string;
  userId: string;
  name: string;
  isCompleted?: boolean;
}

export type StoredTaskSchema = Required<TaskSchema>;
