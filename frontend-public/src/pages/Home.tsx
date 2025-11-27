import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { resolucionesAPI } from '../services/api';
import ResolucionesList from '../components/ResolucionesList';
import './Home.css';

const Home: React.FC = () => {
  const { data: resolucionesData, isLoading } = useQuery({
    queryKey: ['resoluciones-recientes'],
    queryFn: () => resolucionesAPI.getAll({ limit: 6 })
  });

  const resolucionesRecientes = resolucionesData?.data?.resoluciones || [];

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-icon">🏛️</div>
          <h1>Digesto Municipal</h1>
          <p className="hero-subtitle">
            Portal oficial de transparencia y acceso a la información pública del Gobierno Municipal
          </p>
          <div className="hero-actions">
            <Link to="/resoluciones" className="btn btn-primary btn-large">
              🔍 Explorar Resoluciones
            </Link>
          </div>
        </div>
      </section>

      <section className="recent-section">
        <div className="container">
          <div className="section-header">
            <h2>Resoluciones Recientes</h2>
            <p>Últimas publicaciones oficiales del municipio</p>
            <Link to="/resoluciones" className="view-all-link">
              Ver todas las resoluciones →
            </Link>
          </div>

          <ResolucionesList 
            resoluciones={resolucionesRecientes}
            loading={isLoading}
            searchTerm=""
            emptyMessage="No hay resoluciones publicadas recientemente"
          />
        </div>
      </section>

      <section className="info-section">
        <div className="container">
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">📋</div>
              <h3>Transparencia</h3>
              <p>Acceso público a todas las resoluciones y decretos municipales para garantizar la transparencia en la gestión.</p>
            </div>
            
            <div className="info-card">
              <div className="info-icon">🔍</div>
              <h3>Búsqueda Avanzada</h3>
              <p>Encuentre fácilmente la información que necesita mediante nuestro sistema de búsqueda por palabras clave, fechas y categorías.</p>
            </div>
            
            <div className="info-card">
              <div className="info-icon">📥</div>
              <h3>Descargas Directas</h3>
              <p>Descargue los documentos oficiales en formato PDF para su consulta offline o archivo personal.</p>
            </div>

            <div className="info-card">
              <div className="info-icon">🔗</div>
              <h3>Trazabilidad Completa</h3>
              <p>Sistema de vínculos entre resoluciones para seguir el historial completo de modificaciones y derogaciones.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;