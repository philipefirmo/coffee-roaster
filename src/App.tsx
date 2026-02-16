import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import History from './components/History';
import CoffeeList from './components/CoffeeList';
import CoffeeFormPage from './pages/CoffeeFormPage';
import MovementFormPage from './pages/MovementFormPage';
import Login from './pages/Login';
import Profile from './pages/Profile';
import './App.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-espresso-600"></div>
    </div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/historico" element={<History />} />
                  <Route path="/cafes" element={<CoffeeList />} />
                  <Route path="/cafes/novo" element={<CoffeeFormPage />} />
                  <Route path="/cafes/editar/:id" element={<CoffeeFormPage />} />
                  <Route path="/movimentacoes/nova" element={<MovementFormPage />} />
                  <Route path="/movimentacoes/editar/:id" element={<MovementFormPage />} />
                  <Route path="/perfil" element={<Profile />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
