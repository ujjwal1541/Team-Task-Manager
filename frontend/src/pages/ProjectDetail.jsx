import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, UserPlus, UserMinus, Crown, Loader2,
  Calendar, ChevronDown, AlertCircle, Settings, ArrowLeft,
} from 'lucide-react';
import { format, isPast } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const statusMeta = {
  TODO:        { label: 'To Do',       cls: 'bg-gray-100 text-gray-700' },
  IN_PROGRESS: { label: 'In Progress', cls: 'bg-blue-100 text-blue-700' },
  IN_REVIEW:   { label: 'In Review',   cls: 'bg-yellow-100 text-yellow-700' },
  DONE:        { label: 'Done',        cls: 'bg-green-100 text-green-700' },
};

const priorityMeta = {
  LOW:    { cls: 'bg-gray-100 text-gray-600' },
  MEDIUM: { cls: 'bg-blue-50 text-blue-600' },
  HIGH:   { cls: 'bg-orange-100 text-orange-600' },
  URGENT: { cls: 'bg-red-100 text-red-600' },
};

const projectStatuses = ['ACTIVE', 'COMPLETED', 'ARCHIVED'];

// ─── TaskForm ─────────────────────────────────────────────────────────────────

function TaskForm({ initial = {}, members = [], onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(() => {
    const { dueDate: rawDate, ...rest } = initial;
    return {
      title: '',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      assigneeId: '',
      ...rest,
      dueDate: rawDate ? format(new Date(rawDate), 'yyyy-MM-dd') : '',
    };
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
      className="space-y-4"
    >
      <div>
        <label className="label">Title *</label>
        <input className="input" value={form.title} onChange={set('title')} required autoFocus placeholder="What needs to be done?" />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input" rows={2} value={form.description} onChange={set('description')} placeholder="Add more details..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={set('status')}>
            {STATUSES.map((s) => <option key={s} value={s}>{statusMeta[s].label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Priority</label>
          <select className="input" value={form.priority} onChange={set('priority')}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Due date</label>
          <input type="date" className="input" value={form.dueDate} onChange={set('dueDate')} />
        </div>
        <div>
          <label className="label">Assignee</label>
          <select className="input" value={form.assigneeId} onChange={set('assigneeId')}>
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-1">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (initial.id ? 'Save changes' : 'Create task')}
        </button>
      </div>
    </form>
  );
}

// ─── TaskRow ──────────────────────────────────────────────────────────────────

function TaskRow({ task, isAdmin, members, onUpdate, onDelete }) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const overdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'DONE';

  const handleStatusChange = async (status) => {
    setStatusOpen(false);
    try {
      const { data } = await api.put(`/tasks/${task.id}`, { status });
      onUpdate(data);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleEdit = async (form) => {
    setSubmitting(true);
    try {
      const { data } = await api.put(`/tasks/${task.id}`, {
        ...form,
        dueDate: form.dueDate || null,
        assigneeId: form.assigneeId || null,
      });
      onUpdate(data);
      setEditOpen(false);
      toast.success('Task updated');
    } catch {
      toast.error('Failed to update task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-start gap-2">
            <div>
              <p className="text-sm font-medium text-gray-900">{task.title}</p>
              {task.description && (
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{task.description}</p>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="relative inline-block">
            <button
              onClick={() => setStatusOpen((o) => !o)}
              className={`badge cursor-pointer flex items-center gap-1 ${statusMeta[task.status]?.cls}`}
            >
              {statusMeta[task.status]?.label}
              <ChevronDown className="h-3 w-3" />
            </button>
            {statusOpen && (
              <div className="absolute top-7 left-0 z-20 w-36 rounded-xl bg-white shadow-xl ring-1 ring-gray-200 py-1">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 font-medium ${s === task.status ? 'text-primary-600' : 'text-gray-700'}`}
                  >
                    {statusMeta[s].label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </td>
        <td className="px-4 py-3 hidden sm:table-cell">
          <span className={`badge ${priorityMeta[task.priority]?.cls}`}>{task.priority}</span>
        </td>
        <td className="px-4 py-3 hidden md:table-cell">
          {task.dueDate ? (
            <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
              {overdue && <AlertCircle className="h-3 w-3" />}
              <Calendar className="h-3 w-3" />
              {format(new Date(task.dueDate), 'MMM d, yyyy')}
            </span>
          ) : (
            <span className="text-xs text-gray-300">—</span>
          )}
        </td>
        <td className="px-4 py-3 hidden lg:table-cell">
          {task.assignee ? (
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700 uppercase">
                {task.assignee.name[0]}
              </div>
              <span className="text-sm text-gray-700">{task.assignee.name}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-300">Unassigned</span>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => setEditOpen(true)}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Edit
            </button>
            {isAdmin && (
              <button
                onClick={() => onDelete(task.id)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </td>
      </tr>
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit task">
        <TaskForm
          initial={task}
          members={members}
          onSubmit={handleEdit}
          onCancel={() => setEditOpen(false)}
          submitting={submitting}
        />
      </Modal>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState(false);
  const [memberModal, setMemberModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [memberForm, setMemberForm] = useState({ email: '', role: 'MEMBER' });
  const [editForm, setEditForm] = useState({});
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const load = useCallback(() =>
    api.get(`/projects/${id}`)
      .then((res) => { setProject(res.data); setEditForm({ name: res.data.name, description: res.data.description || '', status: res.data.status }); })
      .catch(() => { toast.error('Project not found'); navigate('/projects'); })
      .finally(() => setLoading(false)),
    [id, navigate]
  );

  useEffect(() => { load(); }, [load]);

  const isAdmin = project?.myRole === 'ADMIN';

  // Close status dropdowns when clicking outside
  useEffect(() => {
    const handler = () => document.querySelectorAll('[data-status-dropdown]').forEach(el => el.classList.add('hidden'));
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handleCreateTask = async (form) => {
    setSubmitting(true);
    try {
      const { data } = await api.post(`/projects/${id}/tasks`, {
        ...form,
        dueDate: form.dueDate || null,
        assigneeId: form.assigneeId || null,
      });
      setProject((p) => ({ ...p, tasks: [data, ...p.tasks] }));
      setTaskModal(false);
      toast.success('Task created!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTask = (updated) => {
    setProject((p) => ({ ...p, tasks: p.tasks.map((t) => t.id === updated.id ? updated : t) }));
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setProject((p) => ({ ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }));
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post(`/projects/${id}/members`, memberForm);
      setProject((p) => ({ ...p, members: [...p.members, data] }));
      setMemberModal(false);
      setMemberForm({ email: '', role: 'MEMBER' });
      toast.success('Member added!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member from the project?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      setProject((p) => ({ ...p, members: p.members.filter((m) => m.user.id !== userId) }));
      toast.success('Member removed');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.put(`/projects/${id}`, editForm);
      setProject((p) => ({ ...p, ...data }));
      setEditModal(false);
      toast.success('Project updated');
    } catch {
      toast.error('Failed to update project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      navigate('/projects');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center py-32">
      <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const filteredTasks = (project?.tasks || []).filter((t) => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  const taskCounts = STATUSES.reduce((acc, s) => {
    acc[s] = (project?.tasks || []).filter((t) => t.status === s).length;
    return acc;
  }, {});

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> All projects
      </button>

      {/* Project header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <span className={`badge text-xs ${
                project.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {project.status}
              </span>
              <span className={`badge text-xs ${isAdmin ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
                {isAdmin && <Crown className="h-3 w-3 mr-1" />}
                {project.myRole}
              </span>
            </div>
            <p className="text-gray-500 mt-1.5">{project.description || 'No description'}</p>
          </div>
          {isAdmin && (
            <div className="flex gap-2 shrink-0">
              <button className="btn-secondary gap-1.5" onClick={() => setEditModal(true)}>
                <Settings className="h-4 w-4" /> Settings
              </button>
            </div>
          )}
        </div>

        {/* Task status summary */}
        <div className="mt-5 grid grid-cols-4 gap-3">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
              className={`rounded-xl p-3 text-left transition-all ring-1 ${
                filterStatus === s
                  ? 'ring-primary-400 bg-primary-50'
                  : 'ring-gray-100 hover:ring-gray-200 bg-white'
              }`}
            >
              <p className="text-lg font-bold text-gray-900">{taskCounts[s]}</p>
              <p className="text-xs text-gray-500 mt-0.5">{statusMeta[s].label}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks panel */}
        <div className="lg:col-span-2 card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
            <h2 className="font-semibold text-gray-900">
              Tasks
              <span className="ml-2 text-sm font-normal text-gray-400">
                {filteredTasks.length}{filterStatus || filterPriority ? ' filtered' : ''}
              </span>
            </h2>
            <div className="flex items-center gap-2">
              <select
                className="text-xs rounded-lg border-gray-200 py-1.5 pr-7 text-gray-600 focus:border-primary-400 focus:ring-primary-400"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                {STATUSES.map((s) => <option key={s} value={s}>{statusMeta[s].label}</option>)}
              </select>
              <select
                className="text-xs rounded-lg border-gray-200 py-1.5 pr-7 text-gray-600 focus:border-primary-400 focus:ring-primary-400"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="">All priorities</option>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <button className="btn-primary py-1.5 text-xs" onClick={() => setTaskModal(true)}>
                <Plus className="h-3.5 w-3.5" /> Add task
              </button>
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 text-sm">
                {filterStatus || filterPriority ? 'No tasks match your filters.' : 'No tasks yet. Add the first one!'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Task</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Due</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Assignee</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      isAdmin={isAdmin}
                      members={project.members}
                      onUpdate={handleUpdateTask}
                      onDelete={handleDeleteTask}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Members panel */}
        <div className="card self-start">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              Members <span className="text-sm font-normal text-gray-400">({project.members.length})</span>
            </h2>
            {isAdmin && (
              <button
                className="rounded-lg p-1.5 text-gray-400 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                onClick={() => setMemberModal(true)}
                title="Add member"
              >
                <UserPlus className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-50">
            {project.members.map((m) => (
              <div key={m.id} className="px-5 py-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700 uppercase shrink-0">
                  {m.user.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {m.user.name}
                    {m.user.id === user?.id && <span className="text-gray-400 font-normal"> (you)</span>}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{m.user.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`badge text-xs ${m.role === 'ADMIN' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
                    {m.role === 'ADMIN' && <Crown className="h-3 w-3 mr-1" />}
                    {m.role}
                  </span>
                  {isAdmin && m.user.id !== project.ownerId && m.user.id !== user?.id && (
                    <button
                      onClick={() => handleRemoveMember(m.user.id)}
                      className="rounded-lg p-1 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="Remove member"
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Task modal */}
      <Modal open={taskModal} onClose={() => setTaskModal(false)} title="Create task">
        <TaskForm
          members={project.members}
          onSubmit={handleCreateTask}
          onCancel={() => setTaskModal(false)}
          submitting={submitting}
        />
      </Modal>

      {/* Add Member modal */}
      <Modal open={memberModal} onClose={() => setMemberModal(false)} title="Add member">
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label className="label">Email address *</label>
            <input
              type="email"
              className="input"
              placeholder="colleague@example.com"
              value={memberForm.email}
              onChange={(e) => setMemberForm((f) => ({ ...f, email: e.target.value }))}
              autoFocus
              required
            />
            <p className="text-xs text-gray-400 mt-1">The user must already have an account.</p>
          </div>
          <div>
            <label className="label">Role</label>
            <select
              className="input"
              value={memberForm.role}
              onChange={(e) => setMemberForm((f) => ({ ...f, role: e.target.value }))}
            >
              <option value="MEMBER">Member — can view and update tasks</option>
              <option value="ADMIN">Admin — full access + manage members</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" className="btn-secondary" onClick={() => setMemberModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Project modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Project settings">
        <form onSubmit={handleUpdateProject} className="space-y-4">
          <div>
            <label className="label">Project name *</label>
            <input
              className="input"
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={3}
              value={editForm.description}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={editForm.status}
              onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
            >
              {projectStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <button
              type="button"
              className="btn-danger text-xs py-1.5"
              onClick={handleDeleteProject}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete project
            </button>
            <div className="flex gap-3">
              <button type="button" className="btn-secondary" onClick={() => setEditModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
