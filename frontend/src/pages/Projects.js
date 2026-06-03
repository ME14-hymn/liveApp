import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './Projects.css';

const COLORS = ['#e85d26','#6366f1','#2d9e6b','#d4a017','#d94040','#0ea5e9','#a855f7','#ec4899'];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data)).finally(() => setLoading(false));
  }, []);

  const openCreate = () => { setForm({ name: '', description: '', color: '#6366f1' }); setErrors({}); setModal('create'); };
  const openEdit = (p) => { setForm({ name: p.name, description: p.description||'', color: p.color }); setErrors({}); setModal(p); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setErrors({ name: 'Name is required' }); return; }
    setSaving(true);
    try {
      if (modal === 'create') {
        const r = await api.post('/projects', form);
        setProjects(p => [r.data, ...p]);
        toast.success('Project created');
      } else {
        const r = await api.put(`/projects/${modal.id}`, form);
        setProjects(p => p.map(x => x.id === modal.id ? r.data : x));
        toast.success('Project updated');
      }
      setModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete project? Tasks in this project will be unassigned.')) return;
    await api.delete(`/projects/${id}`);
    setProjects(p => p.filter(x => x.id !== id));
    toast.success('Project deleted');
  };

  return (
    <div>
      <div className="page-header">
        <h1>Projects</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ New Project</button>
      </div>

      {loading ? (
        <div style={{textAlign:'center',padding:40}}><span className="spinner" style={{width:32,height:32}} /></div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">◈</div>
          <p>No projects yet</p>
          <button className="btn btn-primary" onClick={openCreate}>Create your first project</button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(p => (
            <div key={p.id} className="project-card card">
              <div className="project-color-bar" style={{background:p.color}} />
              <div className="project-body">
                <div className="project-name">{p.name}</div>
                {p.description && <div className="project-desc">{p.description}</div>}
                <div className="project-footer">
                  <span className="project-count">{p.task_count} task{p.task_count !== 1 ? 's' : ''}</span>
                  <div style={{display:'flex',gap:4}}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Edit</button>
                    <button className="btn btn-ghost btn-sm" style={{color:'var(--danger)'}} onClick={() => handleDelete(p.id)}>Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{modal === 'create' ? 'New Project' : 'Edit Project'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSave} style={{display:'flex',flexDirection:'column',gap:14}}>
              <div className="form-group">
                <label>Name *</label>
                <input className="form-control" placeholder="Project name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-control" rows={2} placeholder="Optional" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
              </div>
              <div className="form-group">
                <label>Color</label>
                <div className="color-picker">
                  {COLORS.map(c => (
                    <button type="button" key={c} className={`color-dot ${form.color === c ? 'selected' : ''}`}
                      style={{background:c}} onClick={() => setForm(f=>({...f,color:c}))} />
                  ))}
                </div>
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : modal === 'create' ? 'Create' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
