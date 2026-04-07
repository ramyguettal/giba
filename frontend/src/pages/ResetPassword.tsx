import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, ArrowLeft } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API Reset
    setTimeout(() => {
      alert('Password has been reset successfully. You can now log in.');
      navigate('/login');
    }, 1500);
  };

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      display: 'flex', zIndex: 9999, backgroundColor: 'var(--color-surface-2)',
      fontFamily: "'Poppins', sans-serif"
    }}>
      {/* Left Brand Panel - Same as Login */}
      <div style={{ 
        flex: '1 1 45%', 
        background: 'linear-gradient(145deg, #134d2a 0%, #1B6B3A 50%, #2d9058 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '60px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'inset -10px 0 30px rgba(0,0,0,0.1)'
      }}>
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-10%', right: '-15%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%)', borderRadius: '50%' }}></div>
        
        <div style={{ zIndex: 2 }}>
          <div style={{ display: 'inline-block', padding: '12px 24px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', backdropFilter: 'blur(10px)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px' }}>
            GROUPE INDUSTRIEL BABAHOM
          </div>
        </div>

        <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={{ 
            background: 'white', 
            padding: '24px', 
            borderRadius: '24px', 
            marginBottom: '32px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)' 
          }}>
            <img src="/giba.png" alt="GIBA Logo" style={{ width: '220px', height: 'auto', display: 'block' }} />
          </div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 700, margin: '0 0 16px 0', lineHeight: 1.1 }}>
            HR Portal
          </h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.9, fontWeight: 300, maxWidth: '400px', lineHeight: 1.5 }}>
            Securely update your password and get back to your dashboard.
          </p>
        </div>

        <div style={{ zIndex: 2, fontSize: '0.85rem', opacity: 0.7 }}>
          © 2026 GIBA HR Systems. All rights reserved.
        </div>
      </div>

      {/* Right Reset Password Form */}
      <div style={{ 
        flex: '1 1 55%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'var(--color-surface-2)',
        padding: '40px'
      }}>
        <div className="animate-fade-in" style={{ 
          background: 'var(--color-surface)', 
          padding: '48px 56px', 
          borderRadius: '24px', 
          boxShadow: '0 10px 40px rgba(27,107,58,0.08)',
          width: '100%',
          maxWidth: '480px'
        }}>
          <button 
            onClick={() => navigate('/login')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent',
              color: 'var(--color-text-muted)', cursor: 'pointer', marginBottom: '24px', fontSize: '0.9rem',
              fontWeight: 500, padding: 0
            }}
          >
            <ArrowLeft size={16} /> Back to Login
          </button>

          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '8px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Set New Password</h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>Choose a strong password to protect your account</p>
          </div>

          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="••••••••" 
                  style={{ paddingLeft: '48px', paddingRight: '16px', fontSize: '0.95rem', height: '48px', borderRadius: '12px', letterSpacing: '2px' }} 
                  required 
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="••••••••" 
                  style={{ paddingLeft: '48px', paddingRight: '16px', fontSize: '0.95rem', height: '48px', borderRadius: '12px', letterSpacing: '2px' }} 
                  required 
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ 
              width: '100%', justifyContent: 'center', marginTop: '24px', fontSize: '1rem', padding: '16px', borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
              display: 'flex', alignItems: 'center', gap: '8px'
            }} disabled={loading}>
              {loading ? 'Processing...' : 'Update Password'} <ArrowRight size={18} />
            </button>
          </form>

          <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
             Need more help? <a href="#" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Contact IT Support</a>
          </div>
        </div>
      </div>
    </div>
  );
};
