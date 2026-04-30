import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare, Clock, AlertTriangle, TrendingUp,
  FolderOpen, ArrowRight, Calendar,
} from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const statusColors = {
  TODO: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  IN_REVIEW: 'bg-yellow-100 text-yellow-700',
  DONE: 'bg-green-100 text-green-700',
};

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-50 text-blue-600',
  HIGH: 'bg-orange-100 text-orange-600',
  URGENT: 'bg-red-100 text-red-600',
};

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex h-full items-center justify-center py-32">
      <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { stats = {}, recentTasks = [], myTasks = [] } = data || {};

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
          {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">Here&apos;s what&apos;s happening across your projects.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard icon={FolderOpen} label="Active Projects" value={stats.activeProjects ?? 0} color="bg-indigo-50 text-indigo-600" />
        <StatCard icon={CheckSquare} label="Total Tasks" value={stats.totalTasks ?? 0} color="bg-gray-100 text-gray-600" />
        <StatCard icon={Clock} label="In Progress" value={stats.inProgress ?? 0} color="bg-blue-50 text-blue-600" />
        <StatCard icon={TrendingUp} label="In Review" value={stats.inReview ?? 0} color="bg-yellow-50 text-yellow-600" />
        <StatCard icon={CheckSquare} label="Completed" value={stats.done ?? 0} color="bg-green-50 text-green-600" />
        <StatCard icon={AlertTriangle} label="Overdue" value={stats.overdue ?? 0} color="bg-red-50 text-red-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Assigned Tasks */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">My Tasks</h2>
            <Link to="/projects" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View projects <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {myTasks.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-gray-400">No tasks assigned to you</p>
            ) : (
              myTasks.map((task) => (
                <div key={task.id} className="px-6 py-3.5 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{task.project?.name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {task.dueDate && (
                      <span className={`flex items-center gap-1 text-xs ${isPast(new Date(task.dueDate)) ? 'text-red-600' : 'text-gray-400'}`}>
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                      </span>
                    )}
                    <span className={`badge ${statusColors[task.status] || ''}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentTasks.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-gray-400">No recent activity</p>
            ) : (
              recentTasks.map((task) => (
                <Link
                  key={task.id}
                  to={`/projects/${task.project?.id}`}
                  className="px-6 py-3.5 flex items-start gap-3 hover:bg-gray-50 transition-colors block"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {task.project?.name} · {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <span className={`badge ${statusColors[task.status] || ''}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className={`badge ${priorityColors[task.priority] || ''}`}>
                      {task.priority}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
