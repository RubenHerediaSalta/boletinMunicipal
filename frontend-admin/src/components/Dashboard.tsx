import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { resolucionesAPI } from '../services/api';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { data: resolucionesData } = useQuery({
    queryKey: ['resoluciones-dashboard'],
    queryFn: () => resolucionesAPI.getAll({ limit: 5 })
  });

  const stats = {
    total: resolucionesData?.data?.total || 0,
    publicadas: resolucionesData?.data?.resoluciones?.filter((r: any) => r.estado === 'publicado').length || 0,
    borradores: resolucionesData?.data?.resoluciones?.filter((r: any) => r.estado === 'borrador').length || 0,
  };

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Resoluciones</h3>
          <div className="stat-number">{stats.total}</div>
        </div>
        <div className="stat-card">
          <h3>Publicadas</h3>
          <div className="stat-number text-success">{stats.publicadas}</div>
        </div>
        <div className="stat-card">
          <h3>Borradores</h3>
          <div className="stat-number text-warning">{stats.borradores}</div>
        </div>
      </div>

      <div className="recent-actions">
        <div className="section-header">
          <h2>Resoluciones Recientes</h2>
          <Link to="/resoluciones" className="btn btn-outline">
            Ver Todas
          </Link>
        </div>

        <div className="resoluciones-list">
          {resolucionesData?.data?.resoluciones?.map((resolucion: any) => (
            <div key={resolucion.id} className="resolucion-item">
              <div className="resolucion-info">
                <h4>{resolucion.titulo}</h4>
                <div className="resolucion-meta">
                  <span>N° {resolucion.numero}</span>
                  <span>{resolucion.categoria_nombre}</span>
                  <span className={`estado ${resolucion.estado}`}>
                    {resolucion.estado}
                  </span>
                </div>
              </div>
              <Link 
                to={`/editar-resolucion/${resolucion.id}`}
                className="btn btn-outline btn-sm"
              >
                Editar
              </Link>
            </div>
          ))}
        </div>

        {(!resolucionesData?.data?.resoluciones || resolucionesData.data.resoluciones.length === 0) && (
          <div className="empty-state">
            <p>No hay resoluciones aún</p>
            <Link to="/nueva-resolucion" className="btn btn-primary">
              Crear Primera Resolución
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;