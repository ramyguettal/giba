import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, CalendarDays, Clock, FileText, Settings, 
  LogOut, Bell, Search, LayoutDashboard, Menu, X, Globe, Users, Book
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  const role = localStorage.getItem('userRole') || 'employee';

  useEffect(() => {
    document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  if (location.pathname === '/login' || location.pathname === '/reset-password' || location.pathname === '/forgot-password') {
    return <>{children}</>;
  }

  const baseNavItems = [
    { id: 'chat', path: '/chat', label: t('chat_assistant'), icon: MessageSquare },
    { id: 'leave', path: '/leave', label: t('my_leave'), icon: CalendarDays },
    { id: 'hours', path: '/hours', label: t('my_hours'), icon: Clock },
    { id: 'policies', path: '/policies', label: t('hr_policies'), icon: FileText },
    { id: 'settings', path: '/settings', label: t('settings'), icon: Settings },
  ];

  const navItems = role === 'admin' 
    ? [
        { id: 'dashboard', path: '/', label: t('hr_dashboard'), icon: LayoutDashboard },
        { id: 'employees', path: '/employees', label: 'Employee Hub', icon: Users },
        { id: 'admin-leave', path: '/admin-leave', label: 'Leave Approvals', icon: CalendarDays },
        { id: 'kb', path: '/kb', label: 'Knowledge Base', icon: Book },
        { id: 'chatbot-settings', path: '/chatbot-settings', label: 'AI Control', icon: MessageSquare },
        ...baseNavItems
      ] 
    : baseNavItems;

  const handleLanguageToggle = () => {
    const nextLang = i18n.language === 'fr' ? 'en' : i18n.language === 'en' ? 'ar' : 'fr';
    i18n.changeLanguage(nextLang);
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const headerLogoStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    padding: '24px 0',
    borderBottom: '1px solid var(--color-border-subtle)',
    marginBottom: '8px'
  };

  return (
    <div className={`app-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>

      <aside className="app-sidebar">
        {/* UPDATED HEADER: BIG LOGO ONLY */}
        <div style={headerLogoStyles}>
          <img src="/giba.png" alt="GIBA Logo" style={{ width: '120px', height: 'auto', objectFit: 'contain' }} />
          
          {/* Mobile close button floating near the logo */}
          <button 
            className="mobile-menu-btn" 
            style={{ position: 'absolute', right: '16px', top: '16px' }} 
            onClick={() => setSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
                             (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <Link
                to={item.path}
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Language Switcher in Sidebar footer */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--color-border-subtle)' }}>
           <button 
             onClick={handleLanguageToggle}
             className="nav-item w-full" 
             style={{ background: 'var(--color-surface-2)', border: 'none' }}
           >
             <Globe size={20} />
             <span className="nav-label">{i18n.language.toUpperCase()} - Changer Langue</span>
           </button>
        </div>
      </aside>

      <main className="app-main">
        <header className="app-header">
          <div className="header-title-container">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="header-title">
              {navItems.find(n => n.path === location.pathname)?.label || 'GIBA Portal'}
            </div>
          </div>
          
          <div className="header-actions">
            <button className="icon-button"><Search size={20} /></button>
            <button className="icon-button" style={{ position: 'relative' }}>
              <Bell size={20} />
              <span style={{
                position: 'absolute', top: 4, right: 6, width: 8, height: 8,
                backgroundColor: 'var(--color-accent)', borderRadius: '50%'
              }}></span>
            </button>
            
            <div className="user-profile">
              <div className="avatar">
                 {role === 'admin' ? 'A' : 'S'}
              </div>
              <div className="user-info">
                 <span className="user-name">{role === 'admin' ? 'Amine B.' : 'Sarah Connor'}</span>
                 <span className="user-role">{role === 'admin' ? 'HR Admin' : 'Employee (IT)'}</span>
              </div>
            </div>
            
            <button onClick={handleLogout} className="icon-button" style={{ color: 'var(--color-accent)' }}>
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <div className="page-content animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};
