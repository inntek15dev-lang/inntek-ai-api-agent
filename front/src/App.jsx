import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';

import Dashboard from './pages/Dashboard';
import ToolMaker from './pages/ToolMaker';
import Catalog from './pages/Catalog';
import ToolView from './pages/ToolView';
import Config from './pages/Config';

const ProtectedRoute = ({ children, module, action = 'read' }) => {
  const { isAuthenticated, loading, canRead, isAdmin } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-guardian-bg flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-guardian-blue border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black text-guardian-blue uppercase tracking-[0.5em] animate-pulse italic">Authenticating Clearance...</p>
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" />;

  if (module && !canRead(module) && !isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-20 h-20 bg-cyber-pink/10 border border-cyber-pink/30 rounded-full flex items-center justify-center text-cyber-pink animate-pulse">
          <ShieldAlert size={40} />
        </div>
        <div className="space-y-1">
          <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Acceso Denegado</h3>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest italic">Clearance Level Insufficient for this Module</p>
        </div>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 border border-slate-700 text-slate-500 rounded-lg hover:text-white hover:border-white transition-all text-[10px] font-black uppercase tracking-widest"
        >
          Return to Previous Node
        </button>
      </div>
    );
  }

  return children;
};

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
            <Route path="tool-maker/:id" element={
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
