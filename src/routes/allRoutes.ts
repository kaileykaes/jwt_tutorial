import { Router } from 'oak';
import { authorized } from '../middlewares/isAuthorized.ts';
import {
  create,
  deleteTask,
  getById,
  getTasks,
  updateById,
} from '../controllers/tasks.ts';
import { signin, signup } from '../controllers/users.ts';

const router = new Router();

//User routes
router.post('/api/signup', signup)
  .post('/api/signin', signin);

//Task routes
router.post('/api/tasks', authorized, create)
  .get('/api/tasks', authorized, getTasks)
  .get('/api/tasks/:taskId', authorized, getById)
  .patch('/api/tasks/:taskId', authorized, updateById)
  .delete('/api/tasks/:taskId', authorized, deleteTask);

export default router;
