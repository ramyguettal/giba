import React from 'react';
import { CalendarDays, Clock, FileWarning, CheckCircle, Plus, Calendar as CalIcon, AlertCircle } from 'lucide-react';

export const Leave: React.FC = () => {
  return (
    <div className="dashboard-grid">
      <div className="dashboard-card" style={{ gridColumn: 'span 12', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: '1.8rem', marginBottom: '4px' }}>Leave Management</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>Submit requests, view balances, and track upcoming time off.</p>
        </div>
        <button className="btn-primary" style={{ padding: '12px 24px', borderRadius: '12px' }}>
           <Plus size={20} /> Request Leave
        </button>
      </div>

      {/* Balance Column */}
      <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="dashboard-card" style={{ textAlign: 'center', padding: '40px 24px', background: 'linear-gradient(135deg, #1B6B3A, #2d9058)', color: 'white', border: 'none' }}>
          <CalendarDays size={48} style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '16px' }} />
          <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Remaining Annual Balance</div>
          <div className="metric-value" style={{ fontSize: '4rem', margin: '8px 0', color: 'white', fontWeight: 800 }}>14.5</div>
          <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Days out of 30 available</div>
        </div>

        <div className="dashboard-card">
           <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '16px' }}>Other Balances</h3>
           <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
              <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Sick Leave</span>
              <span style={{ fontWeight: 700 }}>12 Days</span>
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
              <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Unpaid Leave</span>
              <span style={{ fontWeight: 700 }}>∞</span>
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
              <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Relocation Leave</span>
              <span style={{ fontWeight: 700 }}>2 Days</span>
           </div>
        </div>
      </div>

      {/* History Column */}
      <div className="dashboard-card" style={{ gridColumn: 'span 8' }}>
        <h3 className="card-title" style={{ marginBottom: '24px' }}>Request History</h3>
        
        <div className="item-list">
          {[
            { date: 'Dec 24 - Dec 31, 2024', type: 'Annual Leave', status: 'Pending', days: 6, submit: 'Oct 12' },
            { date: 'Aug 12 - Aug 16, 2024', type: 'Annual Leave', status: 'Approved', days: 5, submit: 'Jul 04' },
            { date: 'May 05 - May 06, 2024', type: 'Sick Leave', status: 'Approved', days: 2, submit: 'May 04' },
            { date: 'Jan 10, 2024', type: 'Personal Day', status: 'Rejected', days: 1, submit: 'Jan 02' }
          ].map((req, i) => (
             <div className="list-item" key={i} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)', alignItems: 'flex-start', padding: '16px' }}>
                <div className="item-icon" style={{ 
                    background: req.status === 'Approved' ? 'rgba(16, 185, 129, 0.1)' : req.status === 'Rejected' ? 'rgba(192, 57, 43, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                    color: req.status === 'Approved' ? 'var(--color-success)' : req.status === 'Rejected' ? 'var(--color-accent)' : 'var(--color-warning)' 
                }}>
                   {req.status === 'Approved' ? <CheckCircle size={22} /> : req.status === 'Rejected' ? <AlertCircle size={22} /> : <Clock size={22} />}
                </div>
                <div className="item-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                     <div className="item-title" style={{ fontSize: '1.05rem' }}>{req.type}</div>
                     <span className={`badge ${req.status === 'Approved' ? 'badge-approved' : req.status === 'Rejected' ? 'badge-pending' : 'badge-pending'}`} style={{ background: req.status === 'Rejected' ? 'rgba(192, 57, 43, 0.15)' : undefined, color: req.status === 'Rejected' ? 'var(--color-accent)' : undefined }}>
                        {req.status}
                     </span>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CalIcon size={14} /> Dates: {req.date}</div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> Duration: {req.days} days</div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '12px' }}>Submitted on {req.submit}</div>
                </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
};
