import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, Users, Briefcase, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('admin@giba.dz');
  const [password, setPassword] = useState('password');
  const [role, setRole] = useState<'employee' | 'admin'>('employee');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(role === 'admin' ? '/' : '/chat');
    }
  }, [isAuthenticated, navigate, role]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(username, password);
      addToast('Login successful!', { type: 'success' });
    } catch (error: any) {
      const message = error.message || 'Login failed. Please try again.';
      addToast('Login failed', { type: 'error', message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      display: 'flex', 
      flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
      zIndex: 9999, 
      backgroundColor: 'var(--color-surface-2)',
      fontFamily: "'Poppins', sans-serif",
      overflow: 'auto'
    }}>
      {/* Left Brand Panel - Premium Green Look */}
      <div style={{ 
        flex: window.innerWidth <= 768 ? '0 0 auto' : '1 1 45%', 
        background: 'linear-gradient(145deg, #134d2a 0%, #1B6B3A 50%, #2d9058 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: window.innerWidth <= 480 ? '30px 20px' : window.innerWidth <= 768 ? '40px' : '60px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: window.innerWidth <= 768 ? 'none' : 'inset -10px 0 30px rgba(0,0,0,0.1)',
        minHeight: window.innerWidth <= 768 ? 'auto' : '100vh',
        textAlign: window.innerWidth <= 768 ? 'center' : 'left'
      }}>
        {/* Soft light orb effects for modern feel */}
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-10%', right: '-15%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%)', borderRadius: '50%' }}></div>
        
        {/* Top Header inside panel */}
        <div style={{ zIndex: 2 }}>
          <div style={{ display: 'inline-block', padding: '12px 24px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', backdropFilter: 'blur(10px)', fontSize: window.innerWidth <= 480 ? '0.75rem' : '0.85rem', fontWeight: 600, letterSpacing: '1px' }}>
            GROUPE INDUSTRIEL BABAHOM
          </div>
        </div>

        {/* Center Logo Content */}
        <div style={{ 
          zIndex: 2, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: window.innerWidth <= 768 ? 'center' : 'flex-start',
          margin: window.innerWidth <= 768 ? '20px 0' : '0'
        }}>
          <div style={{ 
            background: 'white', 
            padding: window.innerWidth <= 480 ? '16px' : '24px', 
            borderRadius: '24px', 
            marginBottom: window.innerWidth <= 480 ? '20px' : '32px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)' 
          }}>
            <img src="/giba.png" alt="GIBA Logo" style={{ width: window.innerWidth <= 480 ? '140px' : '220px', height: 'auto', display: 'block' }} />
          </div>
          <h1 style={{ 
            fontSize: window.innerWidth <= 480 ? '1.8rem' : window.innerWidth <= 768 ? '2.5rem' : '3.5rem', 
            fontWeight: 700, 
            margin: '0 0 16px 0', 
            lineHeight: 1.1 
          }}>
            HR Portal
          </h1>
          <p style={{ 
            fontSize: window.innerWidth <= 480 ? '0.9rem' : '1.25rem', 
            opacity: 0.9, 
            fontWeight: 300, 
            maxWidth: '400px', 
            lineHeight: 1.5 
          }}>
            Your intelligent assistant for managing leave, tracking performance, and connecting with the company.
          </p>
        </div>

        {/* Footer inside panel */}
        <div style={{ zIndex: 2, fontSize: '0.85rem', opacity: 0.7 }}>
          © 2026 GIBA HR Systems. All rights reserved.
        </div>
      </div>

      {/* Right Login Form */}
      <div style={{ 
        flex: window.innerWidth <= 768 ? '1' : '1 1 55%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'var(--color-surface-2)',
        padding: window.innerWidth <= 480 ? '20px' : window.innerWidth <= 768 ? '30px' : '40px',
        minHeight: window.innerWidth <= 768 ? 'auto' : '100vh'
      }}>
        <div className="animate-fade-in" style={{ 
          background: 'var(--color-surface)', 
          padding: window.innerWidth <= 480 ? '24px' : window.innerWidth <= 768 ? '32px' : '48px 56px', 
          borderRadius: '24px', 
          boxShadow: '0 10px 40px rgba(27,107,58,0.08)',
          width: '100%',
          maxWidth: '480px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: window.innerWidth <= 480 ? '24px' : '40px' }}>
            <h2 style={{ 
              fontSize: window.innerWidth <= 480 ? '1.5rem' : '2rem', 
              marginBottom: '8px', 
              fontWeight: 700, 
              color: 'var(--color-text-primary)' 
            }}>Welcome Back</h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>Log in to access your HR workspace</p>
          </div>

          {/* Role Tabs */}
          <div style={{ 
            display: 'flex', 
            background: 'var(--color-surface-2)', 
            borderRadius: '16px', 
            padding: '6px', 
            marginBottom: '32px',
            gap: '6px'
          }}>
            <button 
              type="button"
              onClick={() => setRole('employee')}
              style={{
                flex: 1, 
                padding: window.innerWidth <= 480 ? '10px' : '12px', 
                borderRadius: '12px', 
                border: 'none',
                background: role === 'employee' ? 'white' : 'transparent',
                color: role === 'employee' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                fontWeight: role === 'employee' ? 600 : 500,
                boxShadow: role === 'employee' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                cursor: 'pointer', 
                transition: 'all 0.2s ease', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px', 
                fontSize: window.innerWidth <= 480 ? '0.8rem' : '0.9rem'
              }}
            >
              <Users size={18} /> Employee
            </button>
            <button 
              type="button"
              onClick={() => setRole('admin')}
              style={{
                flex: 1, 
                padding: window.innerWidth <= 480 ? '10px' : '12px', 
                borderRadius: '12px', 
                border: 'none',
                background: role === 'admin' ? 'white' : 'transparent',
                color: role === 'admin' ? '#C0392B' : 'var(--color-text-muted)',
                fontWeight: role === 'admin' ? 600 : 500,
                boxShadow: role === 'admin' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                cursor: 'pointer', 
                transition: 'all 0.2s ease', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px', 
                fontSize: window.innerWidth <= 480 ? '0.8rem' : '0.9rem'
              }}
            >
              <Briefcase size={18} /> Admin HR
            </button>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>ID Number / Email</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field" 
                  placeholder={role === 'admin' ? "admin@giba.dz" : "e.g., 10423"} 
                  style={{ paddingLeft: '48px', paddingRight: '16px', fontSize: '0.95rem', height: '48px', borderRadius: '12px' }} 
                  required 
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>Forgot password?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field" 
                  placeholder="••••••••" 
                  style={{ paddingLeft: '48px', paddingRight: '16px', fontSize: '0.95rem', height: '48px', borderRadius: '12px', letterSpacing: '2px' }} 
                  required 
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ 
              width: '100%', justifyContent: 'center', marginTop: '24px', fontSize: '1rem', padding: '16px', borderRadius: '12px',
              background: role === 'admin' ? 'linear-gradient(135deg, #C0392B, #e74c3c)' : 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
              display: 'flex', alignItems: 'center', gap: '8px'
            }} disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Sign In'} <ArrowRight size={18} />
            </button>
          </form>

          <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
             Demo credentials - Use any username/password to test
          </div>
        </div>
      </div>
    </div>
  );
};
