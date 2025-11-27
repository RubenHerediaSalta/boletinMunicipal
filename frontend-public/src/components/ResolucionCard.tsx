import React from 'react';
import { Link } from 'react-router-dom';
import { Resolucion } from '../types';
import { getDownloadUrl } from '../services/api';
import './ResolucionCard.css';

interface ResolucionCardProps {
  resolucion: Resolucion;
  searchTerm?: string;
}

const ResolucionCard: React.FC<ResolucionCardProps> = ({ 
  resolucion, 
  searchTerm 
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const highlightText = (text: string, search: string) => {
    if (!search) return text;
    
    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === search.toLowerCase() ? (
            <mark key={index} className="search-highlight">{part}</mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <article className="resolucion-card">
      <div className="card-header">
        <div className="card-badges">
          <span className="badge-categoria">{resolucion.categoria_nombre}</span>
          <span className="badge-numero">N° {resolucion.numero}</span>
        </div>
        <div className="card-date">
          {formatDate(resolucion.fecha_publicacion)}
        </div>
      </div>

      <h3 className="card-title">
        <Link to={`/resolucion/${resolucion.id}`} className="title-link">
          {searchTerm ? highlightText(resolucion.titulo, searchTerm) : resolucion.titulo}
        </Link>
      </h3>

      <div className="card-meta-dates">
        {resolucion.fecha_promulgacion && (
          <div className="meta-date">
            <strong>Promulgación:</strong> {formatDate(resolucion.fecha_promulgacion)}
          </div>
        )}
        {resolucion.fecha_sancion && (
          <div className="meta-date">
            <strong>Sanción:</strong> {formatDate(resolucion.fecha_sancion)}
          </div>
        )}
      </div>

      <div className="card-content">
        <p className="content-preview">
          {searchTerm ? 
            highlightText(resolucion.contenido.substring(0, 200), searchTerm) 
            : resolucion.contenido.substring(0, 200)
          }...
        </p>
      </div>

      {resolucion.tags && resolucion.tags.length > 0 && (
        <div className="card-tags">
          {resolucion.tags.slice(0, 4).map((tag: string, index: number) => (
            <span key={index} className="tag">#{tag}</span>
          ))}
          {resolucion.tags.length > 4 && (
            <span className="tag-more">+{resolucion.tags.length - 4}</span>
          )}
        </div>
      )}

      <div className="card-actions">
        <Link 
          to={`/resolucion/${resolucion.id}`} 
          className="btn btn-primary"
        >
          📄 Ver Detalles
        </Link>
        
        {resolucion.archivo_adjunto && (
          <a 
            href={getDownloadUrl(resolucion.archivo_adjunto)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
          >
            ⬇️ Descargar PDF
          </a>
        )}
      </div>
    </article>
  );
};

export default ResolucionCard;