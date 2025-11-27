import axios from 'axios';
import { Categoria, Resolucion, ResolucionesResponse } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Interceptor para logging de requests
api.interceptors.request.use(
  (config) => {
    console.log(`🔄 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Error en request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Error en response:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// API de resoluciones (público)
export const resolucionesAPI = {
  getAll: (params?: any) => 
    api.get<ResolucionesResponse>('/resoluciones', { 
      params: { ...params, estado: 'publicado' } // Solo publicadas
    }),
  getById: (id: number) => 
    api.get<Resolucion>(`/resoluciones/${id}`),
  getAllTags: () => 
    api.get<string[]>('/resoluciones/tags'),
};

// API de categorías
export const categoriasAPI = {
  getAll: () => 
    api.get<Categoria[]>('/categorias'),
};

// Función para construir URL de descarga
export const getDownloadUrl = (filename: string) => {
  return `${API_URL.replace('/api', '')}/uploads/${filename}`;
};

export default api;