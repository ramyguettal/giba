import React from 'react';
import { 
  Users, UserCheck, UserPlus, Fingerprint, Clock, MapPin, 
  Calendar, FileWarning, Gift, Briefcase, Award, BookOpen, 
  BellRing, Megaphone
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { useTranslation } from 'react-i18next';

export const Dashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  
  // Sample Data for Charts
  const departmentData = [
    { name: 'Engineering', employees: 42 },
    { name: 'Finance', employees: 15 },
    { name: 'HR', employees: 8 },
    { name: 'Marketing', employees: 20 },
    { name: 'Sales', employees: 35 },
  ];

  const recruitmentData = [
    { stage: 'Applied', count: 120 },
    { stage: 'Screening', count: 45 },
    { stage: 'Interview', count: 18 },
    { stage: 'Offer', count: 5 },
  ];

  const COLORS = ['#1B6B3A', '#2d9058', '#C0392B', '#e74c3c', '#F59E0B'];

  return (
    <div className="dashboard-grid" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* 1. Employee Count Overview */}
      <div className="dashboard-card" style={{ gridColumn: 'span 4' }}>
        <div className="card-header">
          <h3 className="card-title"><Users size={20} style={{ margin: i18n.language === 'ar' ? '0 0 0 8px' : '0 8px 0 0' }} /> {t('total_active')}</h3>
        </div>
        <div className="item-list">
          <div className="list-item">
            <div className="item-icon"><Users /></div>
            <div className="item-content" style={{ padding: i18n.language === 'ar' ? '0 16px 0 0' : '0' }}>
              <div className="item-title">{t('total_active')}</div>
              <div className="metric-value" style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', marginTop: 4 }}>324</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div className="list-item" style={{ flex: 1, minWidth: '120px', padding: 8 }}>
              <UserCheck size={20} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 'clamp(1rem, 3vw, 1.2rem)', fontWeight: 600 }}>310</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{t('present')}</div>
              </div>
            </div>
            <div className="list-item" style={{ flex: 1, minWidth: '120px', padding: 8 }}>
              <UserPlus size={20} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 'clamp(1rem, 3vw, 1.2rem)', fontWeight: 600 }}>14</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{t('new_hires')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Attendance Overview */}
      <div className="dashboard-card" style={{ gridColumn: 'span 8' }}>
        <div className="card-header">
          <h3 className="card-title"><Fingerprint size={20} style={{ margin: i18n.language === 'ar' ? '0 0 0 8px' : '0 8px 0 0' }} /> {t('attendance')}</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 16, marginTop: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <div className="item-icon" style={{ margin: '0 auto', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}><UserCheck /></div>
            <h4 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginTop: 12, color: '#10B981' }}>285</h4>
            <span className="metric-label">{t('present')}</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="item-icon" style={{ margin: '0 auto', background: 'rgba(192, 57, 43, 0.1)', color: '#C0392B' }}><FileWarning /></div>
            <h4 style={{ fontSize: '2rem', marginTop: 12, color: '#C0392B' }}>12</h4>
            <span className="metric-label">{t('absent')}</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="item-icon" style={{ margin: '0 auto', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}><Clock /></div>
            <h4 style={{ fontSize: '2rem', marginTop: 12, color: '#F59E0B' }}>8</h4>
            <span className="metric-label">{t('late')}</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="item-icon" style={{ margin: '0 auto', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}><MapPin /></div>
            <h4 style={{ fontSize: '2rem', marginTop: 12, color: '#3B82F6' }}>19</h4>
            <span className="metric-label">{t('remote')}</span>
          </div>
        </div>
      </div>

      {/* 3. Leave Requests */}
      <div className="dashboard-card" style={{ gridColumn: 'span 4' }}>
        <div className="card-header">
          <h3 className="card-title"><Calendar size={20} style={{ margin: i18n.language === 'ar' ? '0 0 0 8px' : '0 8px 0 0' }} /> {t('leave_requests')}</h3>
          <span className="badge badge-pending">{t('pending')}</span>
        </div>
        <div className="item-list">
          {[
            { name: 'Sarah Connor', type: 'Annual', dates: '12 - 16 Aug', status: 'Pending' },
            { name: 'John Doe', type: 'Sick Leave', dates: 'Today', status: 'Approved' },
            { name: 'Amine B.', type: 'Unpaid', dates: '20 Aug', status: 'Pending' }
          ].map((leave, i) => (
            <div className="list-item" key={i}>
              <div className="item-content" style={{ padding: i18n.language === 'ar' ? '0 16px 0 0' : '0' }}>
                <div className="item-title">{leave.name}</div>
                <div className="item-subtitle">{leave.type} • {leave.dates}</div>
              </div>
              <span className={`badge ${leave.status === 'Approved' ? 'badge-approved' : 'badge-pending'}`}>
                {leave.status === 'Approved' ? t('approved') : t('pending')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Department Overview Chart */}
      <div className="dashboard-card" style={{ gridColumn: 'span 4' }}>
        <div className="card-header">
          <h3 className="card-title"><Briefcase size={20} /> Headcount by Dept</h3>
        </div>
        <div style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={departmentData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="employees">
                {departmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Recruitment Pipeline */}
      <div className="dashboard-card" style={{ gridColumn: 'span 4' }}>
        <div className="card-header">
          <h3 className="card-title"><UserPlus size={20} /> Recruitment Pipeline</h3>
        </div>
        <div style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%" style={{ direction: 'ltr' }}>
            <BarChart data={recruitmentData} margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
              <XAxis dataKey="stage" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'rgba(27,107,58,0.05)' }} />
              <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
