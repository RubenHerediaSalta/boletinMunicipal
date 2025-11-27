import axios from 'axios';
import { User, Categoria, Resolucion, ResolucionesResponse, LoginResponse, Vinculo } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    console.log(`🔄 ${config.method?.toUpperCase()} ${config.url}`);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    console.error('❌ Error en request:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Error en response:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) => 
    api.post<LoginResponse>('/auth/login', { email, password }),
  getUser: () => 
    api.get<User>('/auth/user'),
};

export const resolucionesAPI = {
  getAll: (params?: any) => 
    api.get<ResolucionesResponse>('/resoluciones', { params }),
  getById: (id: number) => 
    api.get<Resolucion>(`/resoluciones/${id}`),
  create: (data: FormData) => 
    api.post<Resolucion>('/resoluciones', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  update: (id: number, data: FormData) => 
    api.put<Resolucion>(`/resoluciones/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  delete: (id: number) => 
    api.delete(`/resoluciones/${id}`),
  getAllTags: () => 
    api.get<string[]>('/resoluciones/tags'),
  getVinculos: (id: number) =>
    api.get<Vinculo[]>(`/resoluciones/${id}/vinculos`),
  addVinculo: (id: number, data: any) =>
    api.post<Vinculo>(`/resoluciones/${id}/vinculos`, data),
  deleteVinculo: (id: number) =>
    api.delete(`/resoluciones/vinculos/${id}`),
};

export const categoriasAPI = {
  getAll: () => 
    api.get<Categoria[]>('/categorias'),
};

export const getDownloadUrl = (filename: string) => {
  return `${API_URL.replace('/api', '')}/uploads/${filename}`;
};

export const checkBackendConnection = async (): Promise<boolean> => {
  try {
    console.log('🔍 Verificando conexión con el backend...');
    const response = await api.get('/health');
    const isConnected = response.status === 200;
    console.log('✅ Estado de conexión:', isConnected ? 'Conectado' : 'Error');
    return isConnected;
  } catch (error) {
    console.error('❌ No se pudo conectar al backend:', error);
    return false;
  }
};

export default api;