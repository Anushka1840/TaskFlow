import { Router } from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  toggleTask,
} from '../controllers/task.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All task routes require authentication
router.use(authenticate);

// GET  /tasks          → List tasks (with pagination, filter, search)
// POST /tasks          → Create a new task
router.route('/').get(getTasks).post(createTask);

// GET    /tasks/:id    → Get one task
// PATCH  /tasks/:id    → Update a task
// DELETE /tasks/:id    → Delete a task
router.route('/:id').get(getTask).patch(updateTask).delete(deleteTask);

// PATCH /tasks/:id/toggle → Cycle task status
router.patch('/:id/toggle', toggleTask);

export default router;
