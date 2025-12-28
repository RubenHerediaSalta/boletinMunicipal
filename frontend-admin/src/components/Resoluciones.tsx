import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resolucionesAPI } from '../services/api';
import { Link } from 'react-router-dom';
import './Resoluciones.css';

// Componente para resaltar texto de búsqueda (separado para evitar re-renders)
const HighlightText: React.FC<{ text: string; search: string }> = React.memo(({ text, search }) => {
  if (!search) return <>{text}...</>;

  const parts = text.split(new RegExp(`(${search})`, 'gi'));
  
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === search.toLowerCase() ? (
          <mark key={index} className="search-highlight">{part}</mark>
        ) : (
          part
        )
      )}...
    </>
  );
});

HighlightText.displayName = 'HighlightText';

const Resoluciones: React.FC = () => {
  // Estado principal de filtros
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    estado: '',
    search: '',
    tags: [] as string[]
  });

  // Estado local para UI (no desencadena búsquedas automáticas)
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [localSearch, setLocalSearch] = useState(''); // Solo para el input
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs para mantener referencias estables
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchRef = useRef<string>('');

  const queryClient = useQueryClient();

  // Obtener etiquetas disponibles
  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => resolucionesAPI.getAllTags()
  });

  // Obtener resoluciones con filtros - OPTIMIZADO
  const { data, isLoading, error } = useQuery({
    queryKey: ['resoluciones', filters],
    queryFn: () => resolucionesAPI.getAll(filters)
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => resolucionesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resoluciones'] });
    }
  });

  // Inicialización: cargar etiquetas y sincronizar estado local
  useEffect(() => {
    if (tagsData?.data) {
      setAvailableTags(tagsData.data);
    }
  }, [tagsData]);

  // Sincronizar el estado local con los filtros actuales al cargar
  useEffect(() => {
    if (!isInitialized) {
      setLocalSearch(filters.search);
      setSelectedTags(filters.tags);
      setIsInitialized(true);
    }
  }, [filters, isInitialized]);

  // Sincronizar selectedTags con filters.tags (solo cuando cambian las tags seleccionadas)
  useEffect(() => {
    if (isInitialized) {
      const timeoutId = setTimeout(() => {
        setFilters(prev => ({
          ...prev,
          tags: selectedTags,
          page: 1
        }));
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedTags, isInitialized]);

  // Función para ejecutar búsqueda
  const executeSearch = useCallback(() => {
    if (lastSearchRef.current === localSearch) {
      return; // No hacer nada si la búsqueda no ha cambiado
    }

    setFilters(prev => ({
      ...prev,
      search: localSearch,
      page: 1
    }));
    lastSearchRef.current = localSearch;
    
    // Mantener el foco en el input
    if (searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 10);
    }
  }, [localSearch]);

  // Manejar cambio en el campo de búsqueda - SIN re-renderizar el componente
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearch(value);
    
    // Limpiar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Establecer nuevo timeout para búsqueda automática después de pausa
    searchTimeoutRef.current = setTimeout(() => {
      if (value.length === 0 || value.length >= 2) {
        executeSearch();
      }
    }, 500); // 500ms de delay para permitir escribir
  };

  // Búsqueda inmediata al presionar Enter
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      executeSearch();
    }
  };

  // Botón de búsqueda manual
  const handleSearchButtonClick = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    executeSearch();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar esta resolución?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : prev.page
    }));
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearAllFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      estado: '',
      search: '',
      tags: []
    });
    setLocalSearch('');
    setSelectedTags([]);
    setTagSearch('');
    lastSearchRef.current = '';
    
    // Restaurar el foco al campo de búsqueda
    if (searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };

  const filteredTags = availableTags.filter(tag =>
    tag.toLowerCase().includes(tagSearch.toLowerCase())
  );

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  if (isLoading) return <div className="loading">Cargando resoluciones...</div>;
  if (error) return <div className="error">Error al cargar las resoluciones</div>;

  return (
    <div className="resoluciones-container">
      <div className="page-header">
        <h1>Gestión de Resoluciones</h1>
        <Link to="/nueva-resolucion" className="btn btn-primary">
          Nueva Resolución
        </Link>
      </div>

      {/* Filtros Mejorados */}
      <div className="filters-container">
        <div className="filter-section">
          <h3>Filtros de Búsqueda</h3>
          
          {/* Búsqueda por texto - MEJORADO */}
          <div className="filter-group">
            <label htmlFor="search">Buscar por número, título o contenido:</label>
            <div className="search-input-wrapper">
              <input
                ref={searchInputRef}
                type="text"
                id="search"
                value={localSearch}
                onChange={handleSearchChange}
                onKeyPress={handleSearchKeyPress}
                placeholder="Ej: 001/2024, transparencia, sistema..."
                className="search-input"
                autoComplete="off"
              />
              <button 
                type="button"
                onClick={handleSearchButtonClick}
                className="btn btn-primary btn-sm search-button"
                title="Buscar"
              >
                🔍
              </button>
            </div>
            <small className="search-hint">
              La búsqueda se ejecuta automáticamente después de escribir 2 caracteres o pausar 0.5 segundos
            </small>
          </div>

          <div className="filter-row">
            {/* Filtro por estado */}
            <div className="filter-group">
              <label htmlFor="estado">Estado</label>
              <select
                id="estado"
                value={filters.estado}
                onChange={(e) => handleFilterChange('estado', e.target.value)}
                className="form-select"
              >
                <option value="">Todos los estados</option>
                <option value="publicado">Publicado</option>
                <option value="borrador">Borrador</option>
              </select>
            </div>

            {/* Filtro por etiquetas */}
            <div className="filter-group">
              <label>Filtrar por etiquetas:</label>
              <div className="tags-filter">
                <input
                  type="text"
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="Buscar etiquetas..."
                  className="tag-search-input"
                />
                <div className="tags-list-filter">
                  {filteredTags.slice(0, 10).map(tag => (
                    <label key={tag} className="tag-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        onChange={() => handleTagToggle(tag)}
                      />
                      <span className="tag-label">#{tag}</span>
                    </label>
                  ))}
                  {filteredTags.length === 0 && tagSearch && (
                    <div className="no-tags">No se encontraron etiquetas</div>
                  )}
                </div>
                
                {/* Etiquetas seleccionadas */}
                {selectedTags.length > 0 && (
                  <div className="selected-tags">
                    <strong>Etiquetas seleccionadas:</strong>
                    <div className="selected-tags-list">
                      {selectedTags.map(tag => (
                        <span key={tag} className="selected-tag">
                          #{tag}
                          <button 
                            type="button" 
                            onClick={() => handleTagToggle(tag)}
                            className="tag-remove"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="filter-actions">
            <button 
              onClick={clearAllFilters}
              className="btn btn-outline"
            >
              Limpiar Filtros
            </button>
            
            {/* Contador de resultados */}
            <div className="results-info">
              {data?.data?.total !== undefined && (
                <span>
                  {data.data.total} resultado{data.data.total !== 1 ? 's' : ''} encontrado{data.data.total !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Resoluciones */}
      <div className="resoluciones-list">
        {data?.data?.resoluciones?.map((resolucion: any) => (
          <div key={resolucion.id} className="resolucion-card">
            <div className="resolucion-header">
              <h3>{resolucion.titulo}</h3>
              <div className="resolucion-meta-badges">
                <span className={`estado ${resolucion.estado}`}>
                  {resolucion.estado}
                </span>
                <span className="badge-categoria">
                  {resolucion.categoria_nombre}
                </span>
              </div>
            </div>
            
            <div className="resolucion-meta">
              <div className="meta-item">
                <strong>N°:</strong> {resolucion.numero}
              </div>
              <div className="meta-item">
                <strong>Fecha:</strong> {new Date(resolucion.fecha_publicacion).toLocaleDateString('es-AR')}
              </div>
              <div className="meta-item">
                <strong>Publicado:</strong> {new Date(resolucion.created_at).toLocaleDateString('es-AR')}
            </div>
            </div>

            {/* Vista previa del contenido con highlighting de búsqueda */}
            <p className="resolucion-contenido">
              {filters.search ? (
                <HighlightText text={resolucion.contenido.substring(0, 200)} search={filters.search} />
              ) : (
                resolucion.contenido.substring(0, 200) + '...'
              )}
            </p>

            {/* Etiquetas de la resolución */}
            {resolucion.tags && resolucion.tags.length > 0 && (
              <div className="resolucion-tags">
                {resolucion.tags.map((tag: string) => (
                  <span 
                    key={tag} 
                    className={`tag ${selectedTags.includes(tag) ? 'tag-active' : ''}`}
                    onClick={() => handleTagToggle(tag)}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="resolucion-actions">
              <Link 
                to={`/editar-resolucion/${resolucion.id}`} 
                className="btn btn-outline"
              >
                ✏️ Editar
              </Link>
              <button 
                onClick={() => handleDelete(resolucion.id)}
                className="btn btn-danger"
              >
                🗑️ Eliminar
              </button>
              {resolucion.archivo_adjunto && (
                <a 
                  href={`http://localhost:5000/uploads/${resolucion.archivo_adjunto}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                >
                  📄 Ver PDF
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {data?.data?.resoluciones?.length === 0 && (
        <div className="empty-state">
          {filters.search || filters.estado || selectedTags.length > 0 ? (
            <>
              <p>No se encontraron resoluciones con los filtros aplicados</p>
              <button onClick={clearAllFilters} className="btn btn-primary">
                Ver todas las resoluciones
              </button>
            </>
          ) : (
            <>
              <p>No hay resoluciones aún</p>
              <Link to="/nueva-resolucion" className="btn btn-primary">
                Crear Primera Resolución
              </Link>
            </>
          )}
        </div>
      )}

      {/* Paginación */}
      {data?.data && data.data.totalPages > 1 && (
        <div className="pagination">
          <button 
            className="btn btn-outline"
            disabled={filters.page === 1}
            onClick={() => handleFilterChange('page', filters.page - 1)}
          >
            ← Anterior
          </button>
          
          <div className="pagination-info">
            Página {filters.page} de {data.data.totalPages}
            {data.data.total && (
              <span className="total-items">({data.data.total} total)</span>
            )}
          </div>
          
          <button 
            className="btn btn-outline"
            disabled={filters.page === data.data.totalPages}
            onClick={() => handleFilterChange('page', filters.page + 1)}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
};

export default Resoluciones;