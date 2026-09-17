export type Screen =
  | 'home'
  | 'create'
  | 'join-code'
  | 'lobby'
  | 'role'
  | 'revelacion'
  | 'planeacion'
  | 'construccion'
  | 'evento'
  | 'validacion'
  | 'resultado-ronda'
  | 'votacion'
  | 'rotacion'
  | 'final';

export type Role = 'arquitecto' | 'estructura' | 'materiales' | 'constructor';

export interface RoleInfo {
  label: string;
  icon: string;
  info: string;
  funcion: string;
  rules: [boolean, string][];
}

export interface PlanoArquitecto {
  vista: 'frontal';
  niveles: { nivel: number; pieza: string }[];
}

export interface PlanoEstructura {
  vista: 'superior';
  relaciones: { pieza: string; orientacion: string }[];
}

export interface PlanoMateriales {
  piezas: Record<string, number>;
}

export type PlanoContenido = PlanoArquitecto | PlanoEstructura | PlanoMateriales;

export type EventoTipo =
  | 'pieza_bloqueada'
  | 'cambio_altura'
  | 'silencio'
  | 'plano_perdido'
  | 'reemplazo_pieza';

export interface EventoContenido {
  tipo: EventoTipo;
  duracion_seg: number;
}
