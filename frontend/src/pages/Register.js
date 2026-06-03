import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Min 6 characters';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const set = (k) => e => setForm(f => ({...f, [k]: e.target.value}));

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">TaskFlow</div>
        <h2>Create account</h2>
        <p className="auth-sub">Start managing your tasks</p>
        <form onSubmit={handleSubmit}>
          {[['name','Name','Your name','text'],['email','Email','you@example.com','email'],['password','Password','••••••','password']].map(([k,l,p,t])=>(
            <div className="form-group" style={{marginTop:k==='name'?0:14}} key={k}>
              <label>{l}</label>
              <input className="form-control" type={t} placeholder={p} value={form[k]} onChange={set(k)} />
              {errors[k] && <span className="error-text">{errors[k]}</span>}
            </div>
          ))}
          <button className="btn btn-primary" style={{width:'100%',marginTop:18,justifyContent:'center'}} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>
        <p className="auth-link">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
