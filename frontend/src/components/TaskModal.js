import { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function TaskModal({ task, projects, onSave, onClose }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    due_date: task?.due_date ? task.due_date.split('T')[0] : '',
    project_id: task?.project_id || '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setLoading(true);
    try {
      const payload = { ...form, project_id: form.project_id || null, due_date: form.due_date || null };
      let result;
      if (task) {
        result = await api.put(`/tasks/${task.id}`, payload);
      } else {
        result = await api.post('/tasks', payload);
      }
      toast.success(task ? 'Task updated' : 'Task created');
      onSave(result.data, !task);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving task');
    } finally { setLoading(false); }
  };

  const set = k => e => setForm(f => ({...f, [k]: e.target.value}));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{task ? 'Edit Task' : 'New Task'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:14}}>
          <div className="form-group">
            <label>Title *</label>
            <input className="form-control" placeholder="Task title" value={form.title} onChange={set('title')} />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" rows={3} placeholder="Optional description" value={form.description} onChange={set('description')} />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div className="form-group">
              <label>Status</label>
              <select className="form-control" value={form.status} onChange={set('status')}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select className="form-control" value={form.priority} onChange={set('priority')}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div className="form-group">
              <label>Project</label>
              <select className="form-control" value={form.project_id} onChange={set('project_id')}>
                <option value="">No project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input className="form-control" type="date" value={form.due_date} onChange={set('due_date')} />
            </div>
          </div>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:4}}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : task ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
