import React from 'react';
import { Resolucion } from '../types';
import ResolucionCard from './ResolucionCard';
import './ResolucionesList.css';

interface ResolucionesListProps {
  resoluciones: Resolucion[];
  loading: boolean;
  searchTerm: string;
  emptyMessage?: string;
}

const ResolucionesList: React.FC<ResolucionesListProps> = ({ 
  resoluciones, 
  loading, 
  searchTerm,
  emptyMessage = "No se encontraron resoluciones" 
}) => {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando resoluciones...</p>
      </div>
    );
  }

  if (resoluciones.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📄</div>
        <h3>{emptyMessage}</h3>
        <p>Intenta ajustar los filtros de búsqueda</p>
      </div>
    );
  }

  return (
    <div className="resoluciones-list">
      <div className="results-info">
        <span className="results-count">
          {resoluciones.length} resultado{resoluciones.length !== 1 ? 's' : ''} encontrado{resoluciones.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="resoluciones-grid">
        {resoluciones.map((resolucion) => (
          <ResolucionCard 
            key={resolucion.id} 
            resolucion={resolucion}
            searchTerm={searchTerm}
          />
        ))}
      </div>
    </div>
  );
};

export default ResolucionesList;