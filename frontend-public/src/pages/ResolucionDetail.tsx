import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { resolucionesAPI, getDownloadUrl } from '../services/api';
import { Resolucion, Vinculo } from '../types';
import './ResolucionDetail.css';

const ResolucionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ['resolucion', id],
    queryFn: () => resolucionesAPI.getById(Number(id))
  });

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando resolución...</p>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="error-container">
        <div className="error-icon">❌</div>
        <h2>Resolución no encontrada</h2>
        <p>La resolución solicitada no existe o no está disponible.</p>
        <Link to="/resoluciones" className="btn btn-primary">
          Volver a Resoluciones
        </Link>
      </div>
    );
  }

  const resolucion: Resolucion = data.data;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTipoVinculoTexto = (tipo: string) => {
    const tipos: { [key: string]: string } = {
      'modifica': 'Modifica a',
      'reemplaza': 'Reemplaza a', 
      'deroga': 'Deroga a',
      'complementa': 'Complementa a'
    };
    return tipos[tipo] || tipo;
  };

  return (
    <div className="resolucion-detail">
      <div className="container">
        <div className="detail-header">
          <Link to="/resoluciones" className="back-link">
            ← Volver a Resoluciones
          </Link>
          
          <div className="detail-badges">
            <span className="badge-categoria">{resolucion.categoria_nombre}</span>
            <span className="badge-numero">N° {resolucion.numero}</span>
          </div>
        </div>

        <article className="detail-content">
          <header className="content-header">
            <h1>{resolucion.titulo}</h1>
            <div className="meta-info">
              <span className="meta-item">
                <strong>Fecha de Publicación:</strong> {formatDate(resolucion.fecha_publicacion)}
              </span>
              {resolucion.fecha_promulgacion && (
                <span className="meta-item">
                  <strong>Fecha de Promulgación:</strong> {formatDate(resolucion.fecha_promulgacion)}
                </span>
              )}
              {resolucion.fecha_sancion && (
                <span className="meta-item">
                  <strong>Fecha de Sanción:</strong> {formatDate(resolucion.fecha_sancion)}
                </span>
              )}
            </div>
          </header>

          {/* Historial de Modificaciones */}
          {(resolucion.vinculos_entrantes && resolucion.vinculos_entrantes.length > 0) && (
            <div className="historial-modificaciones">
              <h3>📋 Historial de Modificaciones</h3>
              <div className="vinculos-list">
                {resolucion.vinculos_entrantes.map((vinculo: Vinculo) => (
                  <div key={vinculo.id} className="vinculo-item">
                    <span className="vinculo-tipo">
                      {getTipoVinculoTexto(vinculo.tipo_vinculo)}:
                    </span>
                    <Link 
                      to={`/resolucion/${vinculo.resolucion_id}`}
                      className="vinculo-link"
                    >
                      {vinculo.numero} - {vinculo.titulo}
                    </Link>
                    <span className="vinculo-fecha">
                      ({formatDate(vinculo.fecha_publicacion)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resoluciones vinculadas */}
          {(resolucion.vinculos_salientes && resolucion.vinculos_salientes.length > 0) && (
            <div className="resoluciones-vinculadas">
              <h3>🔗 Resoluciones Relacionadas</h3>
              <div className="vinculos-list">
                {resolucion.vinculos_salientes.map((vinculo: Vinculo) => (
                  <div key={vinculo.id} className="vinculo-item">
                    <span className="vinculo-tipo">
                      Esta resolución {getTipoVinculoTexto(vinculo.tipo_vinculo).toLowerCase()}:
                    </span>
                    <Link 
                      to={`/resolucion/${vinculo.resolucion_vinculada_id}`}
                      className="vinculo-link"
                    >
                      {vinculo.numero} - {vinculo.titulo}
                    </Link>
                    <span className="vinculo-fecha">
                      ({formatDate(vinculo.fecha_publicacion)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resolucion.tags && resolucion.tags.length > 0 && (
            <div className="detail-tags">
              {resolucion.tags.map((tag: string, index: number) => (
                <span key={index} className="tag">#{tag}</span>
              ))}
            </div>
          )}

          <div className="content-body">
            <div className="content-text">
              {resolucion.contenido.split('\n').map((paragraph: string, index: number) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="legal-warning">
            <strong>⚠️ Advertencia Legal:</strong> Solo el documento PDF oficial tiene validez legal. 
            El contenido mostrado aquí es solo informativo.
          </div>

          <div className="download-section">
            <h3>📥 Descargas</h3>
            
            {resolucion.archivo_adjunto && (
              <div className="download-item">
                <a 
                  href={getDownloadUrl(resolucion.archivo_adjunto)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-large"
                >
                  📄 Descargar PDF Oficial
                </a>
                <p className="download-note">
                  Documento oficial con validez legal
                </p>
              </div>
            )}

            {resolucion.anexos && resolucion.anexos.length > 0 && (
              <div className="anexos-section">
                <h4>Anexos:</h4>
                <div className="anexos-list">
                  {resolucion.anexos.map((anexo: string, index: number) => (
                    <a 
                      key={index}
                      href={getDownloadUrl(anexo)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline"
                    >
                      📎 Descargar Anexo {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
};

export default ResolucionDetail;