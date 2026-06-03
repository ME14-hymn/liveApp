import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { exportToCSV, exportToPDF } from '../utils/export';
import TaskModal from '../components/TaskModal';
import './Tasks.css';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | task object
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', project_id: '' });

  const fetchTasks = useCallback(async () => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.project_id) params.project_id = filters.project_id;
    const r = await api.get('/tasks', { params });
    setTasks(r.data);
  }, [filters]);

  useEffect(() => {
    Promise.all([fetchTasks(), api.get('/projects').then(r => setProjects(r.data))]).finally(() => setLoading(false));
  }, [fetchTasks]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    await api.delete(`/tasks/${id}`);
    setTasks(t => t.filter(x => x.id !== id));
    toast.success('Task deleted');
  };

  const handleSave = (task, isNew) => {
    if (isNew) setTasks(t => [task, ...t]);
    else setTasks(t => t.map(x => x.id === task.id ? task : x));
    setModal(null);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Tasks</h1>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV(tasks, 'tasks')}>Export CSV</button>
          <button className="btn btn-secondary btn-sm" onClick={() => exportToPDF(tasks)}>Export PDF</button>
          <button className="btn btn-primary" onClick={() => setModal('create')}>+ New Task</button>
        </div>
      </div>

      <div className="filters card" style={{padding:'14px 16px',marginBottom:20}}>
        <input className="form-control" placeholder="Search tasks…" style={{flex:2}}
          value={filters.search} onChange={e => setFilters(f=>({...f,search:e.target.value}))} />
        <select className="form-control" value={filters.status} onChange={e=>setFilters(f=>({...f,status:e.target.value}))}>
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select className="form-control" value={filters.priority} onChange={e=>setFilters(f=>({...f,priority:e.target.value}))}>
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select className="form-control" value={filters.project_id} onChange={e=>setFilters(f=>({...f,project_id:e.target.value}))}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{textAlign:'center',padding:40}}><span className="spinner" style={{width:32,height:32}} /></div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✓</div>
          <p>No tasks found</p>
          <button className="btn btn-primary" onClick={() => setModal('create')}>Create your first task</button>
        </div>
      ) : (
        <div className="tasks-list">
          {tasks.map(task => (
            <div key={task.id} className="task-card card">
              <div className="task-main">
                <div className="task-title">{task.title}</div>
                {task.description && <div className="task-desc">{task.description}</div>}
                <div className="task-meta">
                  <span className={`badge badge-${task.status}`}>{task.status.replace('_',' ')}</span>
                  <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                  {task.project_name && (
                    <span className="badge" style={{background:task.project_color+'22',color:task.project_color}}>
                      {task.project_name}
                    </span>
                  )}
                  {task.due_date && (
                    <span className="task-due">Due: {new Date(task.due_date).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <div className="task-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => setModal(task)}>Edit</button>
                <button className="btn btn-ghost btn-sm" style={{color:'var(--danger)'}} onClick={() => handleDelete(task.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <TaskModal
          task={modal === 'create' ? null : modal}
          projects={projects}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
