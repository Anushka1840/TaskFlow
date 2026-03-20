import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../lib/response';
import { AuthRequest } from '../types';
import { TaskStatus, TaskPriority } from '@prisma/client';

// ─── Validation Schemas ───────────────────────────────────────────────────────

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(), // LOW | MEDIUM | HIGH
  dueDate: z.string().datetime().optional().nullable(),
});

// All fields optional on update, but at least one must be provided
const updateTaskSchema = createTaskSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided to update.' }
);

// ─── GET /tasks ───────────────────────────────────────────────────────────────
// Supports: pagination, multi-status filter, priority filter, search by title
// Also sorts by priority (HIGH first) then createdAt

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;
    const search = req.query.search as string | undefined;

    // Multi-status filter: ?status=PENDING,IN_PROGRESS
    const statusParam = req.query.status as string | undefined;
    let statusFilter: TaskStatus[] | undefined;
    if (statusParam) {
      const raw = statusParam.split(',').map(s => s.trim().toUpperCase());
      const valid = raw.filter(s => Object.values(TaskStatus).includes(s as TaskStatus)) as TaskStatus[];
      if (valid.length > 0) statusFilter = valid;
    }

    // Priority filter: ?priority=HIGH
    const priorityParam = req.query.priority as string | undefined;
    let priorityFilter: TaskPriority | undefined;
    if (priorityParam && Object.values(TaskPriority).includes(priorityParam.toUpperCase() as TaskPriority)) {
      priorityFilter = priorityParam.toUpperCase() as TaskPriority;
    }

    const where: any = { userId };
    if (statusFilter) where.status = { in: statusFilter };
    if (priorityFilter) where.priority = priorityFilter;
    if (search?.trim()) where.title = { contains: search.trim(), mode: 'insensitive' };

    // Sort: HIGH priority tasks appear first, then by newest
    const priorityOrder: Record<TaskPriority, number> = {
      HIGH: 0,
      MEDIUM: 1,
      LOW: 2,
    };

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          // Prisma doesn't support custom enum ordering directly,
          // so we sort by createdAt desc and handle priority sort client-side
          // OR use a raw sort trick via a separate field. For now: newest first.
          { createdAt: 'desc' },
        ],
      }),
    ]);

    // Sort in-memory by priority after fetching (HIGH → MEDIUM → LOW)
    const sorted = tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // Count per status for the dashboard summary bar
    const statusCounts = await prisma.task.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    });
    const counts = { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0 } as Record<TaskStatus, number>;
    statusCounts.forEach(s => { counts[s.status] = s._count; });

    sendSuccess(res, {
      tasks: sorted,
      statusCounts: counts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    sendError(res, 'Internal server error');
  }
};

// ─── GET /tasks/:id ───────────────────────────────────────────────────────────

export const getTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findFirst({ where: { id, userId: req.user!.id } });
    if (!task) {
      sendError(res, 'Task not found.', 404);
      return;
    }
    sendSuccess(res, task);
  } catch (error) {
    console.error('Get task error:', error);
    sendError(res, 'Internal server error');
  }
};

// ─── POST /tasks ──────────────────────────────────────────────────────────────

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Validation failed', 400, parsed.error.flatten());
      return;
    }
    const { title, description, status, priority, dueDate } = parsed.data;
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || TaskStatus.PENDING,
        priority: priority || TaskPriority.MEDIUM, // default MEDIUM
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: req.user!.id,
      },
    });
    sendSuccess(res, task, 'Task created successfully', 201);
  } catch (error) {
    console.error('Create task error:', error);
    sendError(res, 'Internal server error');
  }
};

// ─── PATCH /tasks/:id ─────────────────────────────────────────────────────────

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await prisma.task.findFirst({ where: { id, userId: req.user!.id } });
    if (!existing) {
      sendError(res, 'Task not found.', 404);
      return;
    }
    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Validation failed', 400, parsed.error.flatten());
      return;
    }
    const { title, description, status, priority, dueDate } = parsed.data;
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
    });
    sendSuccess(res, task, 'Task updated successfully');
  } catch (error) {
    console.error('Update task error:', error);
    sendError(res, 'Internal server error');
  }
};

// ─── DELETE /tasks/:id ────────────────────────────────────────────────────────

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await prisma.task.findFirst({ where: { id, userId: req.user!.id } });
    if (!existing) {
      sendError(res, 'Task not found.', 404);
      return;
    }
    await prisma.task.delete({ where: { id } });
    sendSuccess(res, null, 'Task deleted successfully');
  } catch (error) {
    console.error('Delete task error:', error);
    sendError(res, 'Internal server error');
  }
};

// ─── PATCH /tasks/:id/toggle ──────────────────────────────────────────────────

export const toggleTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await prisma.task.findFirst({ where: { id, userId: req.user!.id } });
    if (!existing) {
      sendError(res, 'Task not found.', 404);
      return;
    }
    const nextStatus: Record<TaskStatus, TaskStatus> = {
      PENDING: TaskStatus.IN_PROGRESS,
      IN_PROGRESS: TaskStatus.COMPLETED,
      COMPLETED: TaskStatus.PENDING,
    };
    const task = await prisma.task.update({
      where: { id },
      data: { status: nextStatus[existing.status] },
    });
    sendSuccess(res, task, `Status changed to ${task.status}`);
  } catch (error) {
    console.error('Toggle task error:', error);
    sendError(res, 'Internal server error');
  }
};
