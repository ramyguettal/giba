import React from 'react';
import { User, Mail, Shield, Bell, Lock, Globe, Database, Save } from 'lucide-react';

export const Settings: React.FC = () => {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ marginBottom: '8px' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '4px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Account Settings</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>Manage your personal details, preferences, and security.</p>
      </div>

      <div className="dashboard-grid">
        {/* Profile Card */}
        <div className="dashboard-card" style={{ gridColumn: 'span 12', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
           <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 800, color: 'white', flexShrink: 0, boxShadow: 'var(--shadow-md)' }}>
             AB
           </div>
           <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                 <div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>Amine B.</h3>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>HR Admin • Employee ID: #10423</div>
                 </div>
                 <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Upload Photo</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                 <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Email Address</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--color-surface-2)', borderRadius: '8px', marginTop: '4px', border: '1px solid var(--color-border-subtle)' }}>
                       <Mail size={16} color="var(--color-text-muted)" /> amine.b@giba.dz
                    </div>
                 </div>
                 <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Department</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--color-surface-2)', borderRadius: '8px', marginTop: '4px', border: '1px solid var(--color-border-subtle)' }}>
                       <Database size={16} color="var(--color-text-muted)" /> Human Resources
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Preferences */}
        <div className="dashboard-card" style={{ gridColumn: 'span 6' }}>
           <h3 className="card-title" style={{ borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '16px', marginBottom: '24px' }}>
             <Globe size={20} /> Preferences
           </h3>
           
           <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: '8px' }}>Interface Language</label>
              <select className="input-field" style={{ cursor: 'pointer' }} defaultValue="en">
                 <option value="en">English (US)</option>
                 <option value="fr">Français (FR)</option>
                 <option value="ar">العربية (AR)</option>
              </select>
           </div>

           <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: '8px' }}>Theme Preference</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                 <div style={{ flex: 1, padding: '12px', border: '2px solid var(--color-primary)', borderRadius: '8px', textAlign: 'center', fontWeight: 600, color: 'var(--color-primary)' }}>Light Mode</div>
                 <div style={{ flex: 1, padding: '12px', border: '1px solid var(--color-border)', borderRadius: '8px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Dark Mode</div>
              </div>
           </div>
        </div>

        {/* Security & Notifications */}
        <div className="dashboard-card" style={{ gridColumn: 'span 6' }}>
           <h3 className="card-title" style={{ borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '16px', marginBottom: '24px' }}>
             <Shield size={20} /> Security & Alerts
           </h3>

           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                 <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Two-Factor Authentication</div>
                 <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Secure your account using an authenticator app.</div>
              </div>
              <button style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', border: 'none', padding: '6px 12px', borderRadius: '100px', fontWeight: 600 }}>Enabled</button>
           </div>

           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                 <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Bell size={16} /> Email Notifications</div>
                 <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Receive updates about leaves and company news.</div>
              </div>
              <div style={{ width: '44px', height: '24px', background: 'var(--color-primary)', borderRadius: '24px', position: 'relative', cursor: 'pointer' }}>
                 <div style={{ position: 'absolute', right: '2px', top: '2px', width: '20px', height: '20px', background: 'white', borderRadius: '50%' }}></div>
              </div>
           </div>
           
           <button style={{ background: 'transparent', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', padding: '12px', borderRadius: '8px', width: '100%', marginTop: '24px', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
             <Lock size={16} /> Change Password
           </button>
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
         <button className="btn-primary">
            <Save size={18} /> Save Changes
         </button>
      </div>
    </div>
  );
};
