import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoriasAPI, resolucionesAPI } from '../services/api';
import './SearchFilters.css';

interface SearchFiltersProps {
  onFiltersChange: (filters: any) => void;
  currentFilters: any;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ 
  onFiltersChange, 
  currentFilters 
}) => {
  const [localFilters, setLocalFilters] = useState(currentFilters);
  const [tagSearch, setTagSearch] = useState('');

  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: categoriasAPI.getAll
  });

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: resolucionesAPI.getAllTags
  });

  const availableTags = tagsData?.data || [];

  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [currentFilters]);

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...localFilters, [key]: value, page: 1 };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSearchChange = (value: string) => {
    handleFilterChange('search', value);
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = localFilters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t: string) => t !== tag)
      : [...currentTags, tag];
    
    handleFilterChange('tags', newTags);
  };

  const clearFilters = () => {
    const resetFilters = {
      search: '',
      categoria: '',
      fechaDesde: '',
      fechaHasta: '',
      fechaPromulgacionDesde: '',
      fechaPromulgacionHasta: '',
      fechaSancionDesde: '',
      fechaSancionHasta: '',
      tags: [],
      page: 1,
      limit: 10
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    setTagSearch('');
  };

  const filteredTags = availableTags.filter(tag =>
    tag.toLowerCase().includes(tagSearch.toLowerCase())
  );

  return (
    <div className="search-filters">
      <div className="filters-header">
        <h3>Buscar Resoluciones</h3>
        <button 
          onClick={clearFilters}
          className="btn-clear"
        >
          Limpiar Filtros
        </button>
      </div>

      <div className="filter-group">
        <label htmlFor="search">Palabras clave:</label>
        <input
          type="text"
          id="search"
          value={localFilters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Buscar por número, título o contenido..."
          className="search-input"
        />
      </div>

      <div className="filters-grid">
        <div className="filter-group">
          <label htmlFor="categoria">Categoría:</label>
          <select
            id="categoria"
            value={localFilters.categoria || ''}
            onChange={(e) => handleFilterChange('categoria', e.target.value)}
            className="filter-select"
          >
            <option value="">Todas las categorías</option>
            {categorias?.data?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="fechaDesde">Publicación desde:</label>
          <input
            type="date"
            id="fechaDesde"
            value={localFilters.fechaDesde || ''}
            onChange={(e) => handleFilterChange('fechaDesde', e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="fechaHasta">Publicación hasta:</label>
          <input
            type="date"
            id="fechaHasta"
            value={localFilters.fechaHasta || ''}
            onChange={(e) => handleFilterChange('fechaHasta', e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="fechaPromulgacionDesde">Promulgación desde:</label>
          <input
            type="date"
            id="fechaPromulgacionDesde"
            value={localFilters.fechaPromulgacionDesde || ''}
            onChange={(e) => handleFilterChange('fechaPromulgacionDesde', e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="fechaPromulgacionHasta">Promulgación hasta:</label>
          <input
            type="date"
            id="fechaPromulgacionHasta"
            value={localFilters.fechaPromulgacionHasta || ''}
            onChange={(e) => handleFilterChange('fechaPromulgacionHasta', e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="fechaSancionDesde">Sanción desde:</label>
          <input
            type="date"
            id="fechaSancionDesde"
            value={localFilters.fechaSancionDesde || ''}
            onChange={(e) => handleFilterChange('fechaSancionDesde', e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="fechaSancionHasta">Sanción hasta:</label>
          <input
            type="date"
            id="fechaSancionHasta"
            value={localFilters.fechaSancionHasta || ''}
            onChange={(e) => handleFilterChange('fechaSancionHasta', e.target.value)}
            className="filter-input"
          />
        </div>
      </div>

      <div className="filter-group">
        <label>Etiquetas:</label>
        <div className="tags-filter">
          <input
            type="text"
            value={tagSearch}
            onChange={(e) => setTagSearch(e.target.value)}
            placeholder="Buscar etiquetas..."
            className="tag-search-input"
          />
          
          <div className="tags-list-filter">
            {filteredTags.slice(0, 8).map(tag => (
              <label key={tag} className="tag-checkbox">
                <input
                  type="checkbox"
                  checked={(localFilters.tags || []).includes(tag)}
                  onChange={() => handleTagToggle(tag)}
                />
                <span className="tag-label">#{tag}</span>
              </label>
            ))}
          </div>

          {(localFilters.tags || []).length > 0 && (
            <div className="selected-tags">
              <div className="selected-tags-list">
                {(localFilters.tags || []).map((tag: string) => (
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
  );
};

export default SearchFilters;