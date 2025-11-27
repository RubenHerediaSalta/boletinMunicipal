import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Resoluciones from './components/Resoluciones';
import NuevaResolucion from './components/NuevaResolucion';
import Layout from './components/Layout';
import './App.css';

const queryClient = new QueryClient();

// Componente para rutas protegidas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  console.log('🛡️ ProtectedRoute - user:', user);
  console.log('🛡️ ProtectedRoute - loading:', loading);
  
  if (loading) {
    return <div className="loading">Cargando...</div>;
  }
  
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  console.log('🚀 App component rendering');
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/resoluciones" element={
                <ProtectedRoute>
                  <Layout>
                    <Resoluciones />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/nueva-resolucion" element={
                <ProtectedRoute>
                  <Layout>
                    <NuevaResolucion />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/editar-resolucion/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <NuevaResolucion />
                  </Layout>
                </ProtectedRoute>
              } />
              {/* Redirección por defecto */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;