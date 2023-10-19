import { Router } from 'oak';
import { signin, signup } from '../controllers/users.ts';
import {
  create,
  deleteTask,
  getById,
  getTasks,
  updateById,
} from '../controllers/tasks.ts';
import { authorized } from '../middlewares/isAuthorized.ts';

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
