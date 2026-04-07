import React from 'react';
import { 
  Calendar, CheckCircle, XCircle, Clock, Filter, 
  Search, Download, Users, Mail, Phone, CalendarCheck
} from 'lucide-react';

export const LeaveAdmin: React.FC = () => {
  const requests = [
    { id: 1, name: 'Sarah Connor', type: 'Annual Leave', dates: '12 Aug - 16 Aug', days: 5, status: 'Pending', dept: 'IT', submit: 'Oct 12' },
    { id: 2, name: 'Amine B.', type: 'Unpaid Leave', dates: '20 Aug', days: 1, status: 'Pending', dept: 'IT', submit: 'Oct 14' },
    { id: 3, name: 'John Doe', type: 'Sick Leave', dates: 'Today', days: 1, status: 'Approved', dept: 'Finance', submit: 'Today' },
    { id: 4, name: 'Leila K.', type: 'Annual Leave', dates: '01 Nov - 10 Nov', days: 10, status: 'Approved', dept: 'HR', submit: 'Oct 10' },
  ];

  return (
    <div className="dashboard-grid">
      <div className="dashboard-card" style={{ gridColumn: 'span 12', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '80px' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: '1.8rem', marginBottom: '4px' }}>Leave & Request Management</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>Review pending requests and maintain employee leave balances.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-primary" style={{ background: 'var(--color-surface)', color: 'var(--color-text-primary)'}}>
             <Download size={18} /> Export Stats
          </button>
        </div>
      </div>

      {/* Admin Stats Overview */}
      <div className="dashboard-card" style={{ gridColumn: 'span 3', textAlign: 'center' }}>
         <div style={{ padding: '16px', background: 'rgba(245,158,11,0.1)', color: 'var(--color-warning)', borderRadius: '16px', width: 'fit-content', margin: '0 auto 16px auto' }}><Clock size={24}/></div>
         <div style={{ fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>PENDING REQUESTS</div>
         <div style={{ fontSize: '2rem', fontWeight: 800 }}>8</div>
      </div>
      <div className="dashboard-card" style={{ gridColumn: 'span 3', textAlign: 'center' }}>
         <div style={{ padding: '16px', background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', borderRadius: '16px', width: 'fit-content', margin: '0 auto 16px auto' }}><CalendarCheck size={24}/></div>
         <div style={{ fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>APPROVED TODAY</div>
         <div style={{ fontSize: '2rem', fontWeight: 800 }}>4</div>
      </div>
      <div className="dashboard-card" style={{ gridColumn: 'span 3', textAlign: 'center' }}>
         <div style={{ padding: '16px', background: 'rgba(59,130,246,0.1)', color: 'var(--color-info)', borderRadius: '16px', width: 'fit-content', margin: '0 auto 16px auto' }}><Users size={24}/></div>
         <div style={{ fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>ABSENT TODAY</div>
         <div style={{ fontSize: '2rem', fontWeight: 800 }}>12</div>
      </div>
      <div className="dashboard-card" style={{ gridColumn: 'span 3', textAlign: 'center' }}>
         <div style={{ padding: '16px', background: 'rgba(27,107,58,0.1)', color: 'var(--color-primary)', borderRadius: '16px', width: 'fit-content', margin: '0 auto 16px auto' }}><Calendar size={24}/></div>
         <div style={{ fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>REMAINING TO PROCESS</div>
         <div style={{ fontSize: '2rem', fontWeight: 800 }}>112</div>
      </div>

      {/* Grid of Requests */}
      {requests.map((req) => (
         <div key={req.id} className="dashboard-card" style={{ gridColumn: 'span 6', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', background: 'var(--color-surface-2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--color-primary)' }}>{req.name.charAt(0)}</div>
                  <div>
                     <h4 style={{ fontWeight: 700, fontSize: '1.05rem' }}>{req.name}</h4>
                     <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{req.dept} • {req.type}</div>
                  </div>
               </div>
               <span className={`badge ${req.status === 'Approved' ? 'badge-approved' : 'badge-pending'}`} style={{ padding: '6px 12px' }}>{req.status}</span>
            </div>

            <div style={{ background: 'var(--color-surface-2)', borderRadius: '16px', padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
               <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>DATES</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{req.dates}</div>
               </div>
               <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>DURATION</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{req.days} Working Days</div>
               </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
               <button className="btn-primary" style={{ flex: 1, background: 'rgba(192, 57, 43, 0.1)', color: 'var(--color-accent)', border: 'none' }}><XCircle size={18}/> Reject</button>
               <button className="btn-primary" style={{ flex: 1 }}><CheckCircle size={18}/> Approve</button>
            </div>
            
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '16px' }}>
               Submitted via Chatbot on {req.submit}
            </div>
         </div>
      ))}
    </div>
  );
};
