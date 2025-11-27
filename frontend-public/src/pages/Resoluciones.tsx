import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { resolucionesAPI } from '../services/api';
import SearchFilters from '../components/SearchFilters';
import ResolucionesList from '../components/ResolucionesList';
import './Resoluciones.css';

const Resoluciones: React.FC = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    search: '',
    categoria: '',
    fechaDesde: '',
    fechaHasta: '',
    tags: []
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['resoluciones', filters],
    queryFn: () => resolucionesAPI.getAll(filters)
  });

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h2>Error al cargar las resoluciones</h2>
        <p>Por favor, intente nuevamente más tarde.</p>
      </div>
    );
  }

  const resoluciones = data?.data?.resoluciones || [];
  const totalResults = data?.data?.total || 0;

  return (
    <div className="resoluciones-page">
      <div className="container">
        <div className="page-header">
          <h1>Resoluciones Municipales</h1>
          <p>Busque y consulte todas las resoluciones oficiales publicadas</p>
        </div>

        <div className="resoluciones-layout">
          {/* Sidebar con filtros */}
          <aside className="filters-sidebar">
            <SearchFilters 
              onFiltersChange={handleFiltersChange}
              currentFilters={filters}
            />
          </aside>

          {/* Contenido principal */}
          <main className="resoluciones-content">
            <ResolucionesList 
              resoluciones={resoluciones}
              loading={isLoading}
              searchTerm={filters.search}
              emptyMessage={
                filters.search || filters.categoria || filters.fechaDesde || filters.fechaHasta || filters.tags.length > 0
                  ? "No se encontraron resoluciones con los filtros aplicados"
                  : "No hay resoluciones publicadas"
              }
            />

            {/* Paginación */}
            {data?.data && data.data.totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="btn btn-outline"
                  disabled={filters.page === 1}
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  ← Anterior
                </button>
                
                <div className="pagination-info">
                  Página {filters.page} de {data.data.totalPages}
                  <span className="total-items">({totalResults} total)</span>
                </div>
                
                <button 
                  className="btn btn-outline"
                  disabled={filters.page === data.data.totalPages}
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Resoluciones;