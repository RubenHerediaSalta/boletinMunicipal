export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  created_at: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  created_at: string;
}

export interface Resolucion {
  id: number;
  titulo: string;
  contenido: string;
  categoria_id: number;
  categoria_nombre: string;
  fecha_publicacion: string;
  fecha_promulgacion: string | null;
  fecha_sancion: string | null;
  numero: string;
  archivo_adjunto: string | null;
  anexos: string[];
  tags: string[];
  estado: 'publicado' | 'borrador';
  created_at: string;
  updated_at: string;
  vinculos_salientes?: Vinculo[];
  vinculos_entrantes?: Vinculo[];
}

export interface Vinculo {
  id: number;
  resolucion_id: number;
  resolucion_vinculada_id: number;
  tipo_vinculo: 'modifica' | 'reemplaza' | 'deroga' | 'complementa';
  numero: string;
  titulo: string;
  fecha_publicacion: string;
}

export interface ResolucionesResponse {
  resoluciones: Resolucion[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export interface LoginResponse {
  token: string;
  user: User;
}