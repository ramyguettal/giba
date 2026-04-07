import React from 'react';
import { Clock, Calendar, Briefcase, FileQuestion, CheckCircle2, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const Hours: React.FC = () => {
  const weeklyData = [
    { day: 'Mon', hours: 8 },
    { day: 'Tue', hours: 8.5 },
    { day: 'Wed', hours: 7.5 },
    { day: 'Thu', hours: 9 },
    { day: 'Fri', hours: 8 },
  ];

  return (
    <div className="dashboard-grid">
      <div className="dashboard-card" style={{ gridColumn: 'span 12', marginBottom: '8px' }}>
        <h2 className="card-title" style={{ fontSize: '1.8rem', marginBottom: '4px' }}>My Work Hours</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>Overview of your attendance, worked hours, and overtime.</p>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-card" style={{ gridColumn: 'span 4', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ padding: '16px', background: 'rgba(27,107,58,0.1)', borderRadius: '16px', color: 'var(--color-primary)' }}>
          <Clock size={32} />
        </div>
        <div>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Total Hours (This Week)</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>41.0 <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>hrs</span></div>
        </div>
      </div>

      <div className="dashboard-card" style={{ gridColumn: 'span 4', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ padding: '16px', background: 'rgba(59,130,246,0.1)', borderRadius: '16px', color: 'var(--color-info)' }}>
          <Briefcase size={32} />
        </div>
        <div>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Overtime Logged</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>3.5 <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>hrs</span></div>
        </div>
      </div>

      <div className="dashboard-card" style={{ gridColumn: 'span 4', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ padding: '16px', background: 'rgba(16,185,129,0.1)', borderRadius: '16px', color: 'var(--color-success)' }}>
          <CheckCircle2 size={32} />
        </div>
        <div>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Current Status</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)' }}>Checked In</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>Since 08:15 AM today</div>
        </div>
      </div>

      {/* Chart */}
      <div className="dashboard-card" style={{ gridColumn: 'span 7' }}>
        <h3 className="card-title" style={{ marginBottom: '24px' }}>Weekly Timesheet</h3>
        <div style={{ height: '260px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="hours" fill="var(--color-primary)" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Logs */}
      <div className="dashboard-card" style={{ gridColumn: 'span 5' }}>
        <h3 className="card-title" style={{ marginBottom: '24px' }}>Recent Punch Logs</h3>
        <div className="item-list">
          {[
            { date: 'Today, Oct 24', in: '08:15 AM', out: '...', status: 'Active' },
            { date: 'Yesterday, Oct 23', in: '08:05 AM', out: '04:30 PM', status: 'Completed' },
            { date: 'Tuesday, Oct 22', in: '08:20 AM', out: '05:15 PM', status: 'Completed' },
            { date: 'Monday, Oct 21', in: '09:00 AM', out: '06:00 PM', status: 'Late In' },
          ].map((log, i) => (
            <div key={i} className="list-item" style={{ background: 'var(--color-surface)' }}>
              <div style={{ padding: '10px', background: 'var(--color-surface-2)', borderRadius: '12px', color: 'var(--color-text-secondary)' }}>
                <Calendar size={20} />
              </div>
              <div className="item-content">
                <div className="item-title" style={{ fontSize: '0.9rem' }}>{log.date}</div>
                <div className="item-subtitle" style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                  <span style={{ color: 'var(--color-success)' }}>In: {log.in}</span> • <span style={{ color: 'var(--color-accent)' }}>Out: {log.out}</span>
                </div>
              </div>
              <div>
                {log.status === 'Active' && <span className="badge badge-info">Active</span>}
                {log.status === 'Completed' && <span className="badge badge-approved">Done</span>}
                {log.status === 'Late In' && <span className="badge badge-pending">Late</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
