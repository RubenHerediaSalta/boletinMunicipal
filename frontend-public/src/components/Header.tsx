import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header: React.FC = () => {
  const location = useLocation();

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Link to="/" className="logo-link">
            <div className="logo-icon">🏛️</div>
            <div className="logo-text">
              <h1>Digesto Municipal</h1>
              <p>Gobierno de la Ciudad</p>
            </div>
          </Link>
        </div>

        <nav className="navigation">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Inicio
          </Link>
          <Link 
            to="/resoluciones" 
            className={`nav-link ${location.pathname === '/resoluciones' ? 'active' : ''}`}
          >
            Resoluciones
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;