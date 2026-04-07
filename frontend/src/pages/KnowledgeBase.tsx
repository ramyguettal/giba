import React, { useState } from 'react';
import { 
  Database, Upload, Search, Filter, FileText, CheckCircle2, 
  Clock, AlertTriangle, RefreshCw, Layers, Eye, Trash2, 
  Tag, Download
} from 'lucide-react';

export const KnowledgeBase: React.FC = () => {
  const [documents, setDocuments] = useState([
    { id: 1, name: 'Employee Handbook 2024.pdf', category: 'Policies', size: '2.4 MB', status: 'Indexed', usage: 142, date: 'Oct 01, 2024' },
    { id: 2, name: 'Remote Work Policy.pdf', category: 'Procedures', size: '1.2 MB', status: 'Indexed', usage: 89, date: 'Oct 05, 2024' },
    { id: 3, name: 'Insurance_Contract_v3.pdf', category: 'Benefits', size: '3.1 MB', status: 'Processing', usage: 0, date: 'Oct 10, 2024' },
    { id: 4, name: 'Onboarding_Flowchart.png', category: 'Onboarding', size: '840 KB', status: 'Indexed', usage: 24, date: 'Sep 24, 2024' },
  ]);

  return (
    <div className="dashboard-grid">
      {/* Header */}
      <div className="dashboard-card" style={{ gridColumn: 'span 12', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: '1.8rem', marginBottom: '4px' }}>Knowledge Base & RAG Management</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>Upload internal documents to train the HR Chatbot for employee queries.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-primary" style={{ background: 'var(--color-surface)', color: 'var(--color-text-primary)'}}>
             <RefreshCw size={18} /> Re-index All
          </button>
          <button className="btn-primary">
             <Upload size={18} /> Upload New Doc
          </button>
        </div>
      </div>

      {/* RAG Engine Status */}
      <div className="dashboard-card" style={{ gridColumn: 'span 12', background: 'rgba(27,107,58,0.02)', border: '1px dashed var(--color-primary)', display: 'flex', alignItems: 'center', gap: '32px', marginBottom: '16px' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ color: 'var(--color-primary)' }}><Database size={32}/></div>
            <div>
               <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Vector Database</div>
               <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>ChromaDB (Active)</div>
            </div>
         </div>
         <div style={{ width: '1px', height: '40px', background: 'var(--color-border-subtle)' }}></div>
         <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Documents Indexed</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>42 Files / 1.4M Tokens</div>
         </div>
         <div style={{ width: '1px', height: '40px', background: 'var(--color-border-subtle)' }}></div>
         <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Last Training</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>2 hours ago</div>
         </div>
         <div style={{ flex: 1, textAlign: 'right' }}>
            <span className="badge badge-approved" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>System Healthy</span>
         </div>
      </div>

      {/* Toolbar */}
      <div className="dashboard-card" style={{ gridColumn: 'span 12', padding: '16px', display: 'flex', gap: '16px' }}>
         <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input type="text" className="input-field" placeholder="Search knowledge base..." style={{ paddingLeft: '48px' }} />
         </div>
         <button className="icon-button" style={{ borderRadius: '12px', border: '1px solid var(--color-border)' }}><Filter size={18}/></button>
      </div>

      {/* Document List */}
      <div className="dashboard-card" style={{ gridColumn: 'span 12', padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <tr>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Filename</th>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Category</th>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>RAG Status</th>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Usage Count</th>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background 0.2s' }}>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: 'var(--color-primary)' }}><FileText size={20}/></div>
                    <div style={{ overflow: 'hidden' }}>
                       <div style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.name}</div>
                       <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{doc.size} • Uploaded {doc.date}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                     <Tag size={14} color="var(--color-text-muted)"/>
                     <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{doc.category}</span>
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {doc.status === 'Indexed' ? (
                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-success)', fontSize: '0.85rem', fontWeight: 600 }}>
                            <CheckCircle2 size={16}/> {doc.status}
                         </div>
                      ) : (
                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-warning)', fontSize: '0.85rem', fontWeight: 600 }}>
                            <Clock size={16} className="animate-spin-slow"/> {doc.status}...
                         </div>
                      )}
                   </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                   <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{doc.usage} <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>references</span></div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="icon-button" title="View Data"><Eye size={16}/></button>
                    <button className="icon-button" title="Update"><RefreshCw size={16}/></button>
                    <button className="icon-button" style={{ color: 'var(--color-accent)' }} title="Delete"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
