import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { resolucionesAPI, categoriasAPI, getDownloadUrl } from '../services/api';
import './NuevaResolucion.css';

const NuevaResolucion: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: categoriasAPI.getAll
  });

  const { data: resolucionesLista } = useQuery({
    queryKey: ['resoluciones-lista'],
    queryFn: () => resolucionesAPI.getAll({ limit: 1000 })
  });

  const { data: resolucionExistente } = useQuery({
    queryKey: ['resolucion', id],
    queryFn: () => resolucionesAPI.getById(Number(id)),
    enabled: isEditing
  });

  const [formData, setFormData] = useState({
    titulo: '',
    contenido: '',
    categoria_id: '',
    fecha_publicacion: new Date().toISOString().split('T')[0],
    fecha_promulgacion: '',
    fecha_sancion: '',
    numero: '',
    estado: 'borrador',
    archivo_adjunto: null as File | null,
    anexos: [] as File[],
    tags: [] as string[],
    vinculos: [] as any[]
  });

  const [disablePromulgacion, setDisablePromulgacion] = useState(false);
  const [disableSancion, setDisableSancion] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (resolucionExistente?.data) {
      const data = resolucionExistente.data;
      setFormData({
        titulo: data.titulo,
        contenido: data.contenido,
        categoria_id: data.categoria_id.toString(),
        fecha_publicacion: data.fecha_publicacion,
        fecha_promulgacion: data.fecha_promulgacion || '',
        fecha_sancion: data.fecha_sancion || '',
        numero: data.numero,
        estado: data.estado,
        archivo_adjunto: null,
        anexos: [],
        tags: data.tags || [],
        vinculos: data.vinculos_salientes || []
      });
      setDisablePromulgacion(!data.fecha_promulgacion);
      setDisableSancion(!data.fecha_sancion);
    }
  }, [resolucionExistente]);

  const mutation = useMutation({
    mutationFn: isEditing 
      ? (data: FormData) => resolucionesAPI.update(Number(id), data)
      : (data: FormData) => resolucionesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resoluciones'] });
      navigate('/resoluciones');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.[0]?.msg || 
                          'Error al guardar la resolución';
      setSubmitError(errorMessage);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!formData.titulo.trim()) {
      setSubmitError('El título es obligatorio');
      return;
    }
    if (!formData.contenido.trim()) {
      setSubmitError('El contenido es obligatorio');
      return;
    }
    if (!formData.numero.trim()) {
      setSubmitError('El número de resolución es obligatorio');
      return;
    }
    if (!formData.categoria_id) {
      setSubmitError('La categoría es obligatoria');
      return;
    }

    const submitData = new FormData();
    
    submitData.append('titulo', formData.titulo);
    submitData.append('contenido', formData.contenido);
    submitData.append('categoria_id', formData.categoria_id);
    submitData.append('fecha_publicacion', formData.fecha_publicacion);
    submitData.append('numero', formData.numero);
    submitData.append('estado', formData.estado);
    
    if (!disablePromulgacion && formData.fecha_promulgacion) {
      submitData.append('fecha_promulgacion', formData.fecha_promulgacion);
    }
    
    if (!disableSancion && formData.fecha_sancion) {
      submitData.append('fecha_sancion', formData.fecha_sancion);
    }
    
    if (formData.tags && formData.tags.length > 0) {
      submitData.append('tags', JSON.stringify(formData.tags));
    } else {
      submitData.append('tags', JSON.stringify([]));
    }
    
    if (formData.vinculos && formData.vinculos.length > 0) {
      submitData.append('vinculos', JSON.stringify(formData.vinculos));
    } else {
      submitData.append('vinculos', JSON.stringify([]));
    }
    
    if (formData.archivo_adjunto) {
      submitData.append('archivo_adjunto', formData.archivo_adjunto);
    }

    formData.anexos.forEach(anexo => {
      submitData.append('anexos', anexo);
    });

    try {
      await mutation.mutateAsync(submitData);
    } catch (error) {
      console.error('❌ Error completo en submit:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (name === 'archivo_adjunto') {
      setFormData(prev => ({ ...prev, [name]: files ? files[0] : null }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAnexosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newAnexos = Array.from(files);
      setFormData(prev => ({
        ...prev,
        anexos: [...prev.anexos, ...newAnexos]
      }));
    }
  };

  const handleRemoveAnexo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      anexos: prev.anexos.filter((_, i) => i !== index)
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleAddVinculo = () => {
    setFormData(prev => ({
      ...prev,
      vinculos: [...prev.vinculos, { tipo_vinculo: 'modifica', resolucion_vinculada_id: '' }]
    }));
  };

  const handleVinculoChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      vinculos: prev.vinculos.map((vinculo, i) => 
        i === index ? { ...vinculo, [field]: value } : vinculo
      )
    }));
  };

  const handleRemoveVinculo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      vinculos: prev.vinculos.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="nueva-resolucion-container">
      <div className="page-header">
        <h1>{isEditing ? 'Editar Resolución' : 'Nueva Resolución'}</h1>
        <button 
          onClick={() => navigate('/resoluciones')}
          className="btn btn-outline"
        >
          ← Volver a Resoluciones
        </button>
      </div>

      {submitError && (
        <div className="alert alert-error">
          <strong>❌ Error:</strong> {submitError}
        </div>
      )}

      <div className="form-container">
        <form onSubmit={handleSubmit} className="resolucion-form">
          <div className="form-section">
            <h3>Información Básica</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="numero" className="required">Número</label>
                <input
                  type="text"
                  id="numero"
                  name="numero"
                  value={formData.numero}
                  onChange={handleChange}
                  required
                  placeholder="Ej: 001/2023"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="categoria_id" className="required">Categoría</label>
                <select
                  id="categoria_id"
                  name="categoria_id"
                  value={formData.categoria_id}
                  onChange={handleChange}
                  required
                  className="form-select"
                >
                  <option value="">Seleccionar categoría</option>
                  {categorias?.data?.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="titulo" className="required">Título</label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                required
                placeholder="Título descriptivo"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Fechas</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fecha_publicacion" className="required">Fecha de Publicación</label>
                <input
                  type="date"
                  id="fecha_publicacion"
                  name="fecha_publicacion"
                  value={formData.fecha_publicacion}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="fecha_promulgacion">
                  <input
                    type="checkbox"
                    checked={!disablePromulgacion}
                    onChange={(e) => setDisablePromulgacion(!e.target.checked)}
                  />
                  Fecha de Promulgación
                </label>
                <input
                  type="date"
                  id="fecha_promulgacion"
                  name="fecha_promulgacion"
                  value={formData.fecha_promulgacion}
                  onChange={handleChange}
                  disabled={disablePromulgacion}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="fecha_sancion">
                  <input
                    type="checkbox"
                    checked={!disableSancion}
                    onChange={(e) => setDisableSancion(!e.target.checked)}
                  />
                  Fecha de Sanción
                </label>
                <input
                  type="date"
                  id="fecha_sancion"
                  name="fecha_sancion"
                  value={formData.fecha_sancion}
                  onChange={handleChange}
                  disabled={disableSancion}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Contenido</h3>
            <div className="form-group">
              <label htmlFor="contenido" className="required">Contenido Completo</label>
              <textarea
                id="contenido"
                name="contenido"
                value={formData.contenido}
                onChange={handleChange}
                required
                rows={12}
                className="form-textarea"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Archivos</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="archivo_adjunto">Documento Principal (PDF)</label>
                <input
                  type="file"
                  id="archivo_adjunto"
                  name="archivo_adjunto"
                  onChange={handleChange}
                  accept=".pdf"
                  className="file-input"
                />
                <small>Documento PDF oficial de la resolución</small>
                
                {resolucionExistente?.data?.archivo_adjunto && (
                  <div className="current-file">
                    <strong>Archivo actual:</strong>
                    <a 
                      href={getDownloadUrl(resolucionExistente.data.archivo_adjunto)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                    >
                      📄 Ver PDF actual
                    </a>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="anexos">Anexos</label>
                <input
                  type="file"
                  id="anexos"
                  name="anexos"
                  onChange={handleAnexosChange}
                  accept=".pdf,image/*,.doc,.docx"
                  multiple
                  className="file-input"
                />
                <small>PDFs, imágenes o documentos Word (máximo 9 archivos)</small>
                
                {formData.anexos.length > 0 && (
                  <div className="anexos-list">
                    <strong>Archivos seleccionados:</strong>
                    <ul>
                      {formData.anexos.map((file, index) => (
                        <li key={index}>
                          {file.name}
                          <button 
                            type="button" 
                            onClick={() => handleRemoveAnexo(index)}
                            className="btn btn-danger btn-sm"
                          >
                            🗑️
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {resolucionExistente?.data?.anexos && resolucionExistente.data.anexos.length > 0 && (
                  <div className="current-anexos">
                    <strong>Anexos actuales:</strong>
                    <ul>
                      {resolucionExistente.data.anexos.map((anexo, index) => (
                        <li key={index}>
                          {anexo}
                          <a 
                            href={getDownloadUrl(anexo)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline btn-sm"
                          >
                            📎 Descargar
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Vínculos con Otras Resoluciones</h3>
            <div className="form-group">
              <label>Esta resolución:</label>
              <div className="vinculos-container">
                {formData.vinculos.map((vinculo, index) => (
                  <div key={index} className="vinculo-item">
                    <select
                      value={vinculo.tipo_vinculo}
                      onChange={(e) => handleVinculoChange(index, 'tipo_vinculo', e.target.value)}
                      className="form-select"
                    >
                      <option value="modifica">Modifica</option>
                      <option value="reemplaza">Reemplaza</option>
                      <option value="deroga">Deroga</option>
                      <option value="complementa">Complementa</option>
                    </select>
                    <select
                      value={vinculo.resolucion_vinculada_id}
                      onChange={(e) => handleVinculoChange(index, 'resolucion_vinculada_id', e.target.value)}
                      className="form-select"
                    >
                      <option value="">Seleccionar resolución</option>
                      {resolucionesLista?.data?.resoluciones
                        ?.filter((r: any) => r.id !== Number(id))
                        .map((resol: any) => (
                          <option key={resol.id} value={resol.id}>
                            {resol.numero} - {resol.titulo}
                          </option>
                        ))}
                    </select>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveVinculo(index)}
                      className="btn btn-danger btn-sm"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={handleAddVinculo}
                  className="btn btn-outline"
                >
                  + Agregar Vínculo
                </button>
              </div>
              <small>Establezca relaciones con otras resoluciones para transparencia</small>
            </div>
          </div>

          <div className="form-section">
            <h3>Etiquetas</h3>
            <div className="form-group">
              <label>Etiquetas</label>
              <div className="tags-input-container">
                <div className="tags-input">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escriba una etiqueta y presione Enter"
                    className="form-input"
                  />
                  <button 
                    type="button" 
                    onClick={handleAddTag}
                    className="btn btn-outline btn-sm"
                  >
                    Agregar
                  </button>
                </div>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="tags-list">
                  {formData.tags.map(tag => (
                    <span key={tag} className="tag">
                      {tag}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveTag(tag)}
                        className="tag-remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3>Estado</h3>
            <div className="form-group">
              <select
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="form-select"
              >
                <option value="borrador">📝 Borrador</option>
                <option value="publicado">✅ Publicado</option>
              </select>
              <small>Los borradores no son visibles al público</small>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigate('/resoluciones')}
              className="btn btn-outline"
            >
              Cancelar
            </button>
            <div className="action-buttons">
              <button 
                type="submit" 
                disabled={mutation.isPending}
                className="btn btn-secondary"
                onClick={(e) => {
                  setFormData(prev => ({ ...prev, estado: 'borrador' }));
                }}
              >
                {mutation.isPending ? 'Guardando...' : 'Guardar Borrador'}
              </button>
              <button 
                type="submit" 
                disabled={mutation.isPending}
                className="btn btn-primary"
                onClick={(e) => {
                  setFormData(prev => ({ ...prev, estado: 'publicado' }));
                }}
              >
                {mutation.isPending ? 'Publicando...' : 'Publicar Resolución'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NuevaResolucion;