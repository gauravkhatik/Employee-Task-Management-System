import express from 'express';
import { getTasks, getTaskById, createTask, updateTask, updateTaskStatus, deleteTask, exportTasksCsv } from '../controllers/taskController.js';

const router = express.Router();

router.get('/export/csv', exportTasksCsv);
router.get('/', getTasks);
router.post('/', createTask);
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.put('/:id/status', updateTaskStatus);
router.delete('/:id', deleteTask);

export default router;
