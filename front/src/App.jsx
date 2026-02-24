import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';

// Pages (Empty shells for now)
import ToolMaker from './pages/ToolMaker';
import Catalog from './pages/Catalog';
import ToolView from './pages/ToolView';
import Config from './pages/Config';

const ProtectedRoute = ({ children, module, action = 'read' }) => {
  const { isAuthenticated, loading, canRead, isAdmin } = useAuth();

  if (loading) return <div>Cargando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;

  if (module && !canRead(module) && !isAdmin) {
    return <div className="p-8 text-center text-red-500 font-bold">Acceso Denegado</div>;
  }

  return children;
};

const Dashboard = () => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold">Dashboard</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="card">
        <h3 className="text-slate-500 text-sm font-semibold uppercase mb-2">Herramientas Totales</h3>
        <p className="text-3xl font-bold">0</p>
      </div>
      <div className="card">
        <h3 className="text-slate-500 text-sm font-semibold uppercase mb-2">Ejecuciones hoy</h3>
        <p className="text-3xl font-bold">0</p>
      </div>
      <div className="card">
        <h3 className="text-slate-500 text-sm font-semibold uppercase mb-2">Estado del Sistema</h3>
        <p className="text-green-500 text-xl font-bold">Operacional</p>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="tool-maker" element={
              <ProtectedRoute module="AI_Tool_Maker">
                <ToolMaker />
              </ProtectedRoute>
            } />
            <Route path="catalog" element={
              <ProtectedRoute module="AI_Tool_Catalog">
                <Catalog />
              </ProtectedRoute>
            } />
            <Route path="tool/:id" element={
              <ProtectedRoute module="AI_Tool_Execution">
                <ToolView />
              </ProtectedRoute>
            } />
            <Route path="config" element={
              <ProtectedRoute module="Config">
                <Config />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
