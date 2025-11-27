import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 AuthProvider iniciando...');
    const token = localStorage.getItem('token');
    console.log('🔑 Token en localStorage:', token ? 'Sí' : 'No');
    
    if (token) {
      console.log('📡 Verificando token con el servidor...');
      authAPI.getUser()
        .then(response => {
          console.log('✅ Usuario verificado:', response.data);
          setUser(response.data);
        })
        .catch((error) => {
          console.error('❌ Error verificando usuario:', error);
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      console.log('🔐 No hay token, usuario no autenticado');
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('📤 Iniciando proceso de login...');
      const response = await authAPI.login(email, password);
      const { token, user } = response.data;
      
      console.log('✅ Login exitoso en API');
      console.log('🔑 Token recibido:', token);
      console.log('👤 Usuario recibido:', user);
      
      localStorage.setItem('token', token);
      console.log('💾 Token guardado en localStorage');
      
      setUser(user);
      console.log('👥 Estado de usuario actualizado');
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error en login:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al iniciar sesión' 
      };
    }
  };

  const logout = () => {
    console.log('🚪 Cerrando sesión...');
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  console.log('🔄 AuthProvider renderizando, user:', user);
  console.log('🔄 AuthProvider loading:', loading);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};