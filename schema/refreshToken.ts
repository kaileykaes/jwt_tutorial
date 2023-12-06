import { State } from './user.ts';
import { z } from 'zod';

export interface RefreshTokenSchema extends State {
  clientIP: string;
}

export const JWT_REGEX = /^[A-Za-z0-9_-]{2,}(?:\.[A-Za-z0-9_-]{2,}){2}$/;
export const RefreshTokenAPI = z.object({
  refreshToken: z.string().regex(JWT_REGEX),
});
