import React, { useState } from 'react';
import { 
  Users, UserPlus, Search, Edit2, Trash2, Filter, 
  MoreVertical, Mail, MapPin, Briefcase, FileText, Upload
} from 'lucide-react';

export const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState([
    { id: '10423', name: 'Amine B.', role: 'Software Developer', dept: 'IT', email: 'amine.b@giba.dz', status: 'Active' },
    { id: '10425', name: 'Sarah Connor', role: 'IT Support', dept: 'IT', email: 'sarah.c@giba.dz', status: 'Active' },
    { id: '20192', name: 'John Doe', role: 'Finance Analyst', dept: 'Finance', email: 'john.d@giba.dz', status: 'On Leave' },
    { id: '30551', name: 'Leila K.', role: 'HR Manager', dept: 'Human Resources', email: 'leila.k@giba.dz', status: 'Active' },
  ]);

  return (
    <div className="dashboard-grid">
      {/* Header & Stats */}
      <div className="dashboard-card" style={{ gridColumn: 'span 12', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: '1.8rem', marginBottom: '4px' }}>Employee Management</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>Direct CRUD operations and profile management.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-primary" style={{ background: 'var(--color-surface)', color: 'var(--color-text-primary)'}}>
             <Upload size={18} /> Bulk Import
          </button>
          <button className="btn-primary">
             <UserPlus size={18} /> Add Employee
          </button>
        </div>
      </div>

      {/* Tool Bar */}
      <div className="dashboard-card" style={{ gridColumn: 'span 12', padding: '16px', display: 'flex', gap: '16px' }}>
         <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input type="text" className="input-field" placeholder="Search by name, ID or department..." style={{ paddingLeft: '48px' }} />
         </div>
         <button className="icon-button" style={{ borderRadius: '12px', border: '1px solid var(--color-border)' }}><Filter size={18}/></button>
      </div>

      {/* Employee Table */}
      <div className="dashboard-card" style={{ gridColumn: 'span 12', padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <tr>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Employee</th>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>ID / Email</th>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Role & Dept</th>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Status</th>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background 0.2s' }}>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', background: 'var(--color-primary-subtle)', color: 'var(--color-primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{emp.name.charAt(0)}</div>
                    <div style={{ fontWeight: 600 }}>{emp.name}</div>
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>#{emp.id}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{emp.email}</div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{emp.role}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{emp.dept}</div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span className={`badge ${emp.status === 'Active' ? 'badge-approved' : 'badge-pending'}`} style={{ fontSize: '0.75rem' }}>{emp.status}</span>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="icon-button" style={{ color: 'var(--color-primary)' }}><Edit2 size={16}/></button>
                    <button className="icon-button" style={{ color: 'var(--color-accent)' }}><Trash2 size={16}/></button>
                    <button className="icon-button"><MoreVertical size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Showing 4 employees</div>
           <div style={{ display: 'flex', gap: '8px' }}>
              <button disabled className="icon-button" style={{ border: '1px solid var(--color-border-subtle)', borderRadius: '8px' }}>Prev</button>
              <button className="icon-button" style={{ border: '1px solid var(--color-border-subtle)', borderRadius: '8px', background: 'var(--color-primary)', color: 'white' }}>1</button>
              <button className="icon-button" style={{ border: '1px solid var(--color-border-subtle)', borderRadius: '8px' }}>Next</button>
           </div>
        </div>
      </div>
    </div>
  );
};
