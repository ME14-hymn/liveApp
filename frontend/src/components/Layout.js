import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Layout.css';

const icons = {
  dashboard: '▦', tasks: '✓', projects: '◈', profile: '◉',
  logout: '→', moon: '◑', sun: '○', menu: '≡', close: '✕'
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="layout">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">TaskFlow</div>
          <button className="btn btn-ghost sidebar-close" onClick={() => setOpen(false)}>{icons.close}</button>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({isActive})=>isActive?'nav-item active':'nav-item'} onClick={()=>setOpen(false)}>
            <span>{icons.dashboard}</span> Dashboard
          </NavLink>
          <NavLink to="/tasks" className={({isActive})=>isActive?'nav-item active':'nav-item'} onClick={()=>setOpen(false)}>
            <span>{icons.tasks}</span> Tasks
          </NavLink>
          <NavLink to="/projects" className={({isActive})=>isActive?'nav-item active':'nav-item'} onClick={()=>setOpen(false)}>
            <span>{icons.projects}</span> Projects
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <NavLink to="/profile" className={({isActive})=>isActive?'nav-item active':'nav-item'} onClick={()=>setOpen(false)}>
            <span>{icons.profile}</span> {user?.name}
          </NavLink>
          <button className="nav-item" onClick={handleLogout}>
            <span>{icons.logout}</span> Logout
          </button>
        </div>
      </aside>
      {open && <div className="overlay" onClick={() => setOpen(false)} />}
      <main className="main">
        <header className="topbar">
          <button className="btn btn-ghost menu-btn" onClick={() => setOpen(true)}>{icons.menu}</button>
          <div className="topbar-right">
            <button className="btn btn-ghost theme-btn" onClick={toggle} title="Toggle theme">
              {theme === 'light' ? icons.moon : icons.sun}
            </button>
          </div>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
