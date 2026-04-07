import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { Chat } from './pages/Chat';
import { Login } from './pages/Login';
import { Leave } from './pages/Leave';
import { Policies } from './pages/Policies';
import { Hours } from './pages/Hours';
import { Settings } from './pages/Settings';
import { ResetPassword } from './pages/ResetPassword';
import { ForgotPassword } from './pages/ForgotPassword';
import { EmployeeManagement } from './pages/EmployeeManagement';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { AdminChatbot } from './pages/AdminChatbot';
import { LeaveAdmin } from './pages/LeaveAdmin';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider, ToastContext } from './context/ToastContext';
import { Toast } from './components/ui/Toast';
import { useAuth } from './hooks/useAuth';
import './App.css';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: 'var(--color-surface-2)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '4px solid var(--color-primary)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Admin only route
const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: 'var(--color-surface-2)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '4px solid var(--color-primary)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !['hr_admin', 'system_admin'].includes(user.role)) {
    return <Navigate to="/chat" replace />;
  }

  return <>{children}</>;
};

// Toast container component
const ToastContainer: React.FC = () => {
  const toastContext = React.useContext(ToastContext);
  if (!toastContext) return null;

  const { toasts, removeToast } = toastContext;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 2000,
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={removeToast}
          duration={5000}
        />
      ))}
    </div>
  );
};

// Main app content
const AppContent: React.FC = () => {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ProtectedAdminRoute>
                  <Dashboard />
                </ProtectedAdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leave"
            element={
              <ProtectedRoute>
                <Leave />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hours"
            element={
              <ProtectedRoute>
                <Hours />
              </ProtectedRoute>
            }
          />
          <Route
            path="/policies"
            element={
              <ProtectedRoute>
                <Policies />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees"
            element={
              <ProtectedRoute>
                <ProtectedAdminRoute>
                  <EmployeeManagement />
                </ProtectedAdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/kb"
            element={
              <ProtectedRoute>
                <ProtectedAdminRoute>
                  <KnowledgeBase />
                </ProtectedAdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/chatbot-settings"
            element={
              <ProtectedRoute>
                <ProtectedAdminRoute>
                  <AdminChatbot />
                </ProtectedAdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-leave"
            element={
              <ProtectedRoute>
                <ProtectedAdminRoute>
                  <LeaveAdmin />
                </ProtectedAdminRoute>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/chat" />} />
        </Routes>
      </AppShell>
      <ToastContainer />
    </BrowserRouter>
  );
};

// Main App with providers
function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
