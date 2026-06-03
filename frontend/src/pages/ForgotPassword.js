import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Enter your email');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch { toast.error('Something went wrong'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">TaskFlow</div>
        {sent ? (
          <>
            <h2>Check your email</h2>
            <p className="auth-sub">If that email exists, a reset link was sent.</p>
            <Link to="/login" className="btn btn-primary" style={{marginTop:18,justifyContent:'center',display:'flex'}}>Back to login</Link>
          </>
        ) : (
          <>
            <h2>Forgot password?</h2>
            <p className="auth-sub">Enter your email to receive a reset link</p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email</label>
                <input className="form-control" type="email" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <button className="btn btn-primary" style={{width:'100%',marginTop:18,justifyContent:'center'}} disabled={loading}>
                {loading ? <span className="spinner" /> : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
        <p className="auth-link"><Link to="/login">← Back to login</Link></p>
      </div>
    </div>
  );
}
