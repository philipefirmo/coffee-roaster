import React from 'react';
import { createHashRouter, RouterProvider, Route, createRoutesFromElements, Navigate, Outlet } from 'react-router-dom';
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

const ProtectedRoute: React.FC = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-espresso-600"></div>
    </div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

const router = createHashRouter(
  createRoutesFromElements(
    <>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/historico" element={<History />} />
        <Route path="/cafes" element={<CoffeeList />} />
        <Route path="/cafes/novo" element={<CoffeeFormPage />} />
        <Route path="/cafes/editar/:id" element={<CoffeeFormPage />} />
        <Route path="/movimentacoes/nova" element={<MovementFormPage />} />
        <Route path="/movimentacoes/editar/:id" element={<MovementFormPage />} />
        <Route path="/perfil" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </>
  )
);

import ScrollToTop from './components/ScrollToTop';

// ... (existing imports)

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppProvider>
          <RouterProvider router={router} />
          {/* ScrollToTop precisa estar dentro do RouterProvider, mas como RouterProvider cria o contexto, 
              ele não pode estar aqui fora. 
              Na v6.4+ com Data Routers, a melhor forma é ter o ScrollToTop dentro do componente Layout ou Root.
              Vou adicionar no Layout.tsx ou criar um wrapper. 
              
              AJUSTE: Com createHashRouter, não podemos colocar componentes "irmãos" do RouterProvider que dependam do Router.
              O ScrollToTop deve ser um componente renderizado dentro das rotas.
              Vou adicionar ao Layout.tsx.
           */}
        </AppProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
