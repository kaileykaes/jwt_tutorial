import { z } from 'zod';

export interface TaskSchema {
  id?: string;
  userId: string;
  name: string;
  isCompleted?: boolean;
}

export type StoredTaskSchema = Required<TaskSchema>;

// Task API
// This is creating a zod object schema whereby zod can validate types

export const TaskAPI = z.object({
  userId: z.string().uuid(),
  name: z.string().min(5).max(500),
})
