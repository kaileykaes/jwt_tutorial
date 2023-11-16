import { exceptFor } from '../../../middlewares/exceptFor.ts';
import { handler as isAuthorized } from '../../../middlewares/isAuthorized.ts';

export const handler = exceptFor({
  '/api/users': ['POST'],
}, isAuthorized);
