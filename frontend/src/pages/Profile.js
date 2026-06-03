import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './Profile.css';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwLoading, setPwLoading] = useState(false);
  const fileRef = useRef();

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Max 2MB'); return; }
    const fd = new FormData();
    fd.append('avatar', file);
    setAvatarLoading(true);
    try {
      const r = await api.post('/auth/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser({ avatar: r.data.avatar });
      toast.success('Avatar updated');
    } catch { toast.error('Upload failed'); }
    finally { setAvatarLoading(false); }
  };

  const validatePw = () => {
    const e = {};
    if (!pwForm.current) e.current = 'Required';
    if (!pwForm.newPw || pwForm.newPw.length < 6) e.newPw = 'Min 6 characters';
    if (pwForm.newPw !== pwForm.confirm) e.confirm = 'Passwords do not match';
    return e;
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    const e2 = validatePw();
    if (Object.keys(e2).length) { setPwErrors(e2); return; }
    setPwLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword: pwForm.current, newPassword: pwForm.newPw });
      toast.success('Password changed');
      setPwForm({ current: '', newPw: '', confirm: '' });
      setPwErrors({});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally { setPwLoading(false); }
  };

  const avatarSrc = user?.avatar
    ? `${process.env.REACT_APP_API_URL?.replace('/api','') || ''  }${user.avatar}`
    : null;

  return (
    <div>
      <div className="page-header"><h1>Profile</h1></div>
      <div className="profile-grid">
        <div className="card profile-card">
          <div className="avatar-section">
            <div className="avatar-wrap" onClick={() => fileRef.current.click()}>
              {avatarSrc ? (
                <img src={avatarSrc} alt="avatar" className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">{user?.name?.[0]?.toUpperCase()}</div>
              )}
              <div className="avatar-overlay">{avatarLoading ? <span className="spinner" /> : '📷'}</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleAvatarChange} />
            <p className="avatar-hint">Click to upload photo (max 2MB)</p>
          </div>
          <div className="profile-info">
            <div className="profile-row"><span className="label">Name</span><span>{user?.name}</span></div>
            <div className="profile-row"><span className="label">Email</span><span>{user?.email}</span></div>
          </div>
        </div>

        <div className="card">
          <h3 style={{marginBottom:20,fontSize:16,fontWeight:600}}>Change Password</h3>
          <form onSubmit={handlePwSubmit} style={{display:'flex',flexDirection:'column',gap:14}}>
            {[['current','Current Password'],['newPw','New Password'],['confirm','Confirm Password']].map(([k,l])=>(
              <div className="form-group" key={k}>
                <label>{l}</label>
                <input className="form-control" type="password" value={pwForm[k]}
                  onChange={e=>setPwForm(f=>({...f,[k]:e.target.value}))} />
                {pwErrors[k] && <span className="error-text">{pwErrors[k]}</span>}
              </div>
            ))}
            <button className="btn btn-primary" type="submit" disabled={pwLoading} style={{alignSelf:'flex-start'}}>
              {pwLoading ? <span className="spinner" /> : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
