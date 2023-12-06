import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';

export function errMessage(er: Error): string {
  if (er instanceof z.ZodError) {
    return fromZodError(er).message;
  }
  return er.message;
}
