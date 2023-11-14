import { State } from './user.ts';

export interface RefreshTokenSchema extends State {
  clientIP: string;
}
