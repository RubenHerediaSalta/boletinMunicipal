import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>Boletín Municipal</h2>
          <p>Panel de Admin</p>
        </div>
        
        <div className="sidebar-menu">
          <Link 
            to="/" 
            className={`menu-item ${location.pathname === '/' ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/resoluciones" 
            className={`menu-item ${location.pathname === '/resoluciones' ? 'active' : ''}`}
          >
            Resoluciones
          </Link>
          <Link 
            to="/nueva-resolucion" 
            className={`menu-item ${location.pathname === '/nueva-resolucion' ? 'active' : ''}`}
          >
            Nueva Resolución
          </Link>
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <strong>{user?.nombre}</strong>
            <span>{user?.email}</span>
          </div>
          <button onClick={handleLogout} className="btn btn-outline btn-sm">
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;