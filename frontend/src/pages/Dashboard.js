import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import './Dashboard.css';

const STATUS_COLORS = { todo: '#9b9590', in_progress: '#d4a017', done: '#2d9e6b' };
const PRIORITY_COLORS = { low: '#2d9e6b', medium: '#d4a017', high: '#d94040' };

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks/stats').then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:60}}><span className="spinner" style={{width:36,height:36}} /></div>;

  const statusData = stats?.byStatus?.map(s => ({ name: s.status.replace('_',' '), value: +s.count, color: STATUS_COLORS[s.status] })) || [];
  const priorityData = stats?.byPriority?.map(p => ({ name: p.priority, value: +p.count, color: PRIORITY_COLORS[p.priority] })) || [];

  return (
    <div>
      <div className="page-header">
        <h1>Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Total Tasks', value: stats?.total || 0, icon: '✓' },
          { label: 'In Progress', value: stats?.byStatus?.find(s=>s.status==='in_progress')?.count || 0, icon: '◔' },
          { label: 'Completed', value: stats?.byStatus?.find(s=>s.status==='done')?.count || 0, icon: '◉' },
          { label: 'High Priority', value: stats?.byPriority?.find(p=>p.priority==='high')?.count || 0, icon: '▲' },
        ].map(s => (
          <div className="stat-card card" key={s.label}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="card">
          <h3 className="chart-title">Tasks by Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            {statusData.map(s => (
              <div key={s.name} className="legend-item">
                <span className="legend-dot" style={{background:s.color}} />
                <span>{s.name}: {s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="chart-title">Priority Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={priorityData} margin={{top:5,right:10,left:-20,bottom:5}}>
              <XAxis dataKey="name" tick={{fontSize:12}} />
              <YAxis tick={{fontSize:12}} />
              <Tooltip />
              <Bar dataKey="value" radius={[4,4,0,0]}>
                {priorityData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {stats?.recent?.length > 0 && (
          <div className="card chart-full">
            <h3 className="chart-title">Tasks Created (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={stats.recent} margin={{top:5,right:10,left:-20,bottom:5}}>
                <XAxis dataKey="date" tick={{fontSize:11}} tickFormatter={d=>d.slice(5)} />
                <YAxis tick={{fontSize:12}} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#e85d26" strokeWidth={2} dot={{fill:'#e85d26',r:4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {stats?.byProject?.length > 0 && (
          <div className="card">
            <h3 className="chart-title">Top Projects</h3>
            {stats.byProject.map(p => (
              <div key={p.name} className="proj-bar-row">
                <span className="proj-name">{p.name}</span>
                <div className="proj-bar-track">
                  <div className="proj-bar-fill" style={{width:`${(p.count/stats.byProject[0].count)*100}%`}} />
                </div>
                <span className="proj-count">{p.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning'; if (h < 17) return 'afternoon'; return 'evening';
}
