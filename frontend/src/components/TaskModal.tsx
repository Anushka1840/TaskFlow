'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Task } from '@/types';
import clsx from 'clsx';

const schema = z.object({
  title:       z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status:      z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']),
  priority:    z.enum(['LOW', 'MEDIUM', 'HIGH']),
  dueDate:     z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  task?: Task | null;
  onSubmit: (data: FormData) => Promise<void>;
  onClose: () => void;
  loading: boolean;
  serverErrors?: Record<string, string>;
}

// Converts ISO date string → YYYY-MM-DD for <input type="date">
// Uses UTC to prevent timezone shifting the date by one day
function toDateInputValue(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getUTCFullYear();
    const mm   = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd   = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return '';
  }
}

export default function TaskModal({ task, onSubmit, onClose, loading, serverErrors }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'PENDING', priority: 'MEDIUM' },
  });

  // Pre-fill form when editing an existing task
  useEffect(() => {
    if (task) {
      reset({
        title:       task.title,
        description: task.description || '',
        status:      task.status,
        priority:    task.priority,
        dueDate:     toDateInputValue(task.dueDate),
      });
    } else {
      reset({ title: '', description: '', status: 'PENDING', priority: 'MEDIUM', dueDate: '' });
    }
  }, [task, reset]);

  // Renders error from either client validation or server response
  const FieldError = ({ name }: { name: keyof FormData }) => {
    const msg = errors[name]?.message || serverErrors?.[name];
    if (!msg) return null;
    return <p className="text-red-500 text-xs mt-1 flex items-center gap-1">⚠️ {msg}</p>;
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white rounded-t-xl z-10">
          <h2 className="text-lg font-semibold">
            {task ? '✏️ Edit Task' : '➕ New Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title')}
              className={clsx('input', errors.title && 'border-red-400 focus:ring-red-400')}
              placeholder="What needs to be done?"
              autoFocus
            />
            <FieldError name="title" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Description
              <span className="text-gray-400 font-normal ml-1">(optional)</span>
            </label>
            <textarea
              {...register('description')}
              className="input resize-none"
              rows={3}
              placeholder="Add more details..."
            />
          </div>

          {/* Priority — full width, prominent */}
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select {...register('priority')} className="input">
              <option value="HIGH">🔴 High — urgent, do first</option>
              <option value="MEDIUM">🟡 Medium — normal priority</option>
              <option value="LOW">🟢 Low — do when time allows</option>
            </select>
            <FieldError name="priority" />
          </div>

          {/* Status + Due Date side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select {...register('status')} className="input">
                <option value="PENDING">⏳ Pending</option>
                <option value="IN_PROGRESS">🔵 In Progress</option>
                <option value="COMPLETED">✅ Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <input {...register('dueDate')} type="date" className="input" />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading
                ? (task ? 'Saving...' : 'Creating...')
                : (task ? 'Save Changes' : 'Create Task')
              }
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
