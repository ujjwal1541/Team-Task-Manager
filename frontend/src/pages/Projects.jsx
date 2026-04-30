import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderOpen, Users, CheckSquare, Loader2, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Modal from '../components/Modal';

const statusBadge = {
  ACTIVE: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  ARCHIVED: 'bg-gray-100 text-gray-600',
};

function ProjectCard({ project }) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="card p-5 hover:shadow-md hover:ring-primary-200 transition-all block group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
          <FolderOpen className="h-5 w-5 text-primary-600" />
        </div>
        <span className={`badge ${statusBadge[project.status] || ''}`}>{project.status}</span>
      </div>
      <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
        {project.name}
      </h3>
      <p className="text-sm text-gray-500 mt-1 line-clamp-2 min-h-[2.5rem]">
        {project.description || 'No description'}
      </p>
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <CheckSquare className="h-3.5 w-3.5" />
          {project._count?.tasks ?? 0} tasks
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {project.members?.length ?? 0} members
        </span>
        <span className={`ml-auto flex items-center gap-1 font-medium ${project.myRole === 'ADMIN' ? 'text-primary-600' : 'text-gray-400'}`}>
          {project.myRole === 'ADMIN' && <Crown className="h-3 w-3" />}
          {project.myRole}
        </span>
      </div>
    </Link>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadProjects = () =>
    api.get('/projects')
      .then((res) => setProjects(res.data))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));

  useEffect(() => { loadProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Project name is required'); return; }
    setSubmitting(true);
    try {
      const { data } = await api.post('/projects', form);
      setProjects((p) => [data, ...p]);
      setShowModal(false);
      setForm({ name: '', description: '' });
      toast.success('Project created!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center py-32">
      <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} you&apos;re part of</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" /> New project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card p-16 text-center">
          <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No projects yet</h3>
          <p className="text-gray-500 mt-1 mb-6">Create your first project to get started.</p>
          <button className="btn-primary mx-auto" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" /> Create project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create new project">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Project name *</label>
            <input
              className="input"
              placeholder="e.g. Marketing Website Redesign"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              autoFocus
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={3}
              placeholder="What is this project about?"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
