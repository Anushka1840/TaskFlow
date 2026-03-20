'use client';

import { Task } from '@/types';
import { format, isPast, isToday } from 'date-fns';
import clsx from 'clsx';

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

const statusConfig = {
  PENDING:     { label: 'Pending',     className: 'bg-yellow-100 text-yellow-800' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-blue-100 text-blue-800'   },
  COMPLETED:   { label: 'Completed',   className: 'bg-green-100 text-green-800'  },
};

const priorityConfig = {
  HIGH:   { label: '🔴 High',   className: 'bg-red-100 text-red-700 border border-red-200'       },
  MEDIUM: { label: '🟡 Medium', className: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
  LOW:    { label: '🟢 Low',    className: 'bg-green-50 text-green-700 border border-green-200'   },
};

export default function TaskCard({ task, onEdit, onDelete, onToggle }: Props) {
  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority];

  const isOverdue  = task.dueDate && task.status !== 'COMPLETED' && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
  const isDueToday = task.dueDate && task.status !== 'COMPLETED' && isToday(new Date(task.dueDate));

  return (
    <div className={clsx(
      'card transition-all hover:shadow-md border flex flex-col gap-3',
      task.status === 'COMPLETED' && 'opacity-70',
      isOverdue  && 'border-red-300 bg-red-50/30',
      isDueToday && 'border-orange-300 bg-orange-50/30',
    )}>

      {/* Overdue / Due Today banner */}
      {isOverdue && (
        <div className="text-xs font-semibold text-red-600 bg-red-100 -mx-5 -mt-5 px-5 py-1.5 rounded-t-xl">
          ⚠️ Overdue
        </div>
      )}
      {isDueToday && !isOverdue && (
        <div className="text-xs font-semibold text-orange-600 bg-orange-100 -mx-5 -mt-5 px-5 py-1.5 rounded-t-xl">
          📅 Due Today
        </div>
      )}

      {/* Title row + action buttons */}
      <div className="flex items-start justify-between gap-2">
        <h3 className={clsx(
          'font-semibold text-gray-900 leading-snug',
          task.status === 'COMPLETED' && 'line-through text-gray-400'
        )}>
          {task.title}
        </h3>

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 shrink-0 -mt-0.5">
          <button
            onClick={() => onToggle(task.id)}
            title="Cycle status"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
          >
            🔄
          </button>
          <button
            onClick={() => onEdit(task)}
            title="Edit task"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(task.id)}
            title="Delete task"
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-gray-500 line-clamp-2 -mt-1">{task.description}</p>
      )}

      {/* Status + Priority badges */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', status.className)}>
          {status.label}
        </span>
        <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', priority.className)}>
          {priority.label}
        </span>
      </div>

      {/* Due date */}
      {task.dueDate && (
        <p className={clsx(
          'text-xs font-medium',
          isOverdue  ? 'text-red-500' :
          isDueToday ? 'text-orange-500' : 'text-gray-400'
        )}>
          📆 Due {format(new Date(task.dueDate), 'MMM d, yyyy')}
        </p>
      )}

      {/* Created date */}
      <p className="text-xs text-gray-300 -mt-1">
        Created {format(new Date(task.createdAt), 'MMM d, yyyy')}
      </p>
    </div>
  );
}
