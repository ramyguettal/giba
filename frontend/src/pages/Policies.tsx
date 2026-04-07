import React from 'react';
import { FileText, Download, ShieldCheck } from 'lucide-react';

export const Policies: React.FC = () => {
  const documents = [
    { name: 'Politique de Télétravail', date: 'Mise à jour: Jan 2024', size: '1.2 MB' },
    { name: 'Règlement Intérieur GIBA', date: 'Mise à jour: Nov 2023', size: '3.4 MB' },
    { name: 'Processus d\'Évaluation Annuelle', date: 'Mise à jour: Déc 2023', size: '850 KB' },
    { name: 'Code de Conduite et Éthique', date: 'Mise à jour: Fev 2024', size: '2.1 MB' }
  ];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ padding: '16px', background: 'var(--color-primary-subtle)', borderRadius: 'var(--radius-lg)' }}>
           <ShieldCheck size={32} style={{ color: 'var(--color-primary)' }} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>Politiques RH & Documents</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>Consultez la documentation officielle de l'entreprise.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
        {documents.map((doc, i) => (
          <div key={i} className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <FileText size={24} style={{ color: 'var(--color-accent)' }} />
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{doc.name}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>{doc.date} • {doc.size}</p>
              </div>
            </div>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', background: 'var(--color-surface-2)', color: 'var(--color-primary)', boxShadow: 'none' }}>
              <Download size={18} /> Télécharger PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
