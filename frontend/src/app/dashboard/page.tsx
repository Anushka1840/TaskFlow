'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Task, TaskStatus, Pagination } from '@/types';
import TaskCard from '@/components/TaskCard';
import TaskModal from '@/components/TaskModal';
import StatusBar from '@/components/StatusBar';
import { TaskSkeletonGrid } from '@/components/TaskSkeleton';
import NetworkError from '@/components/NetworkError';
import { useAuth } from '@/hooks/useAuth';

const emptyCounts = { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0 };

export default function DashboardPage() {
  const router = useRouter();

  // Fix 3: useAuth handles loading state so no flash of dashboard before redirect
  const { user, authChecked } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [statusCounts, setStatusCounts] = useState(emptyCounts);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [networkError, setNetworkError] = useState(false); // Fix 4

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [page, setPage] = useState(1);

  // ─── Fetch tasks ─────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setNetworkError(false); // reset network error on each attempt
    try {
      const params: Record<string, string> = { page: String(page), limit: '9' };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/tasks', { params });
      setTasks(res.data.data.tasks);
      setPagination(res.data.data.pagination);
      setStatusCounts(res.data.data.statusCounts || emptyCounts);
    } catch (err: any) {
      // Fix 4: distinguish network errors from API errors
      if (!err.response) {
        // No response = server is down / no internet
        setNetworkError(true);
      } else {
        // Fix 1: always show error toast for API errors too
        toast.error(err.response?.data?.message || 'Failed to load tasks');
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { if (authChecked) fetchTasks(); }, [authChecked, fetchTasks]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  // ─── CRUD handlers ────────────────────────────────────────────────────────

  const handleCreate = async (data: any) => {
    setModalLoading(true);
    setServerErrors({});
    try {
      await api.post('/tasks', {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      });
      toast.success('✅ Task created successfully!'); // Fix 1: consistent success toast
      setShowModal(false);
      fetchTasks();
    } catch (err: any) {
      const fieldErrors = err.response?.data?.errors?.fieldErrors;
      if (fieldErrors) {
        const flat: Record<string, string> = {};
        Object.entries(fieldErrors).forEach(([k, v]) => { flat[k] = (v as string[])[0]; });
        setServerErrors(flat);
        toast.error('Please fix the errors in the form.'); // Fix 1: toast even for field errors
      } else {
        toast.error(err.response?.data?.message || 'Failed to create task'); // Fix 1
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingTask) return;
    setModalLoading(true);
    setServerErrors({});
    try {
      await api.patch(`/tasks/${editingTask.id}`, {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      });
      toast.success('✅ Task updated successfully!'); // Fix 1
      setEditingTask(null);
      setShowModal(false);
      fetchTasks();
    } catch (err: any) {
      const fieldErrors = err.response?.data?.errors?.fieldErrors;
      if (fieldErrors) {
        const flat: Record<string, string> = {};
        Object.entries(fieldErrors).forEach(([k, v]) => { flat[k] = (v as string[])[0]; });
        setServerErrors(flat);
        toast.error('Please fix the errors in the form.'); // Fix 1
      } else {
        toast.error(err.response?.data?.message || 'Failed to update task'); // Fix 1
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    try {
      await api.delete(`/tasks/${id}`);
      toast.success('🗑️ Task deleted.'); // Fix 1
      fetchTasks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete task'); // Fix 1
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await api.patch(`/tasks/${id}/toggle`);
      toast.success(`🔄 ${res.data.message || 'Status updated'}`); // Fix 1
      fetchTasks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status'); // Fix 1
    }
  };

  // Fix 6: proper logout — clears storage and uses replace() so back button
  // goes to login, not back to the dashboard
  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.post('/auth/logout', { refreshToken });
    } catch {}
    localStorage.clear();
    router.replace('/login'); // replace instead of push = can't go back
  };

  const openCreate = () => { setEditingTask(null); setServerErrors({}); setShowModal(true); };
  const openEdit = (task: Task) => { setEditingTask(task); setServerErrors({}); setShowModal(true); };

  // ─── Empty state (3 different messages) ──────────────────────────────────
  const EmptyState = () => {
    if (search) return (
      <div className="text-center py-20 px-4">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-gray-600 font-medium">No tasks match &quot;{search}&quot;</p>
        <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
        <button onClick={() => setSearch('')} className="btn-secondary mt-4 text-sm">
          Clear Search
        </button>
      </div>
    );
    if (statusFilter) return (
      <div className="text-center py-20 px-4">
        <p className="text-4xl mb-3">📂</p>
        <p className="text-gray-600 font-medium">
          No {statusFilter.replace('_', ' ').toLowerCase()} tasks
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Try a different filter or create a new task
        </p>
        <button onClick={() => setStatusFilter('')} className="btn-secondary mt-4 text-sm">
          Clear Filter
        </button>
      </div>
    );
    return (
      <div className="text-center py-20 px-4">
        <p className="text-5xl mb-4">📋</p>
        <p className="text-gray-600 font-semibold text-lg">No tasks yet</p>
        <p className="text-sm text-gray-400 mt-1">Create your first task to get started!</p>
        <button onClick={openCreate} className="btn-primary mt-4">
          + Create First Task
        </button>
      </div>
    );
  };

  // Fix 3: Show a full-screen spinner while auth is being checked
  // This prevents the dashboard content flashing before redirect to login
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-spin">⚙️</div>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar — responsive, works on mobile */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <h1 className="text-xl font-bold text-blue-600">TaskFlow</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Hide name on very small screens to save space */}
            <span className="text-sm text-gray-500 hidden sm:block truncate max-w-[150px]">
              👋 {user?.name}
            </span>
            <button onClick={handleLogout} className="btn-secondary text-sm py-1.5 shrink-0">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* Status summary bar */}
        <StatusBar
          counts={statusCounts}
          activeFilter={statusFilter}
          onFilter={(s) => setStatusFilter(s as TaskStatus | '')}
        />

        {/* Search + New Task — stacks on mobile */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="🔍 Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input flex-1"
          />
          <button onClick={openCreate} className="btn-primary sm:whitespace-nowrap">
            + New Task
          </button>
        </div>

        {/* Result count */}
        {!loading && !networkError && pagination && (
          <p className="text-sm text-gray-400">
            {pagination.total === 0
              ? 'No tasks found'
              : `Showing ${tasks.length} of ${pagination.total} task${pagination.total !== 1 ? 's' : ''}`}
          </p>
        )}

        {/* Fix 4: Network error state */}
        {networkError ? (
          <NetworkError onRetry={fetchTasks} />
        ) : loading ? (
          <TaskSkeletonGrid />
        ) : tasks.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!networkError && pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={!pagination.hasPrev}
              className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!pagination.hasNext}
              className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </main>

      {/* Create / Edit Modal */}
      {showModal && (
        <TaskModal
          task={editingTask}
          onSubmit={editingTask ? handleUpdate : handleCreate}
          onClose={() => { setShowModal(false); setEditingTask(null); }}
          loading={modalLoading}
          serverErrors={serverErrors}
        />
      )}
    </div>
  );
}
