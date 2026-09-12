export type Rol =
  | 'arquitecto'
  | 'explorador_estructura'
  | 'explorador_materiales'
  | 'constructor'

export interface Partida {
  id: string
  codigo_sala: string
  creada_en: string
  terminada_en: string | null
}

export interface Jugador {
  id: string
  partida_id: string
  auth_user_id: string
  nombre: string
  rol: Rol
}

export interface SesionLocal {
  jugadorId: string
  partidaId: string
  codigoSala: string
  rol: Rol
  nombre: string
  esHost: boolean
}

export const ROLES_EN_ORDEN: Rol[] = [
  'arquitecto',
  'explorador_estructura',
  'explorador_materiales',
  'constructor',
]

export const ROL_INFO: Record<
  Rol,
  {
    titulo: string
    color: string
    resumen: string
    veEn: string[]
    responsabilidad: string
  }
> = {
  arquitecto: {
    titulo: 'Arquitecto',
    color: '#818cf8',
    resumen: 'Tienes la vista frontal de la torre: alturas y niveles.',
    veEn: [
      'Disposición vertical de las piezas',
      'Altura total de cada nivel',
      'Posición frontal de cada bloque',
    ],
    responsabilidad:
      'Describe la estructura general para que el Constructor entienda la forma que debe tener la torre.',
  },
  explorador_estructura: {
    titulo: 'Explorador de Estructura',
    color: '#34d399',
    resumen: 'Tienes la vista lateral y superior: cómo se conectan las piezas.',
    veEn: [
      'Vista lateral y cenital de la torre',
      'Relaciones entre piezas y puntos de apoyo',
      'Zonas de equilibrio y tensión',
    ],
    responsabilidad:
      'Comunica la distribución espacial para garantizar que la torre sea estable.',
  },
  explorador_materiales: {
    titulo: 'Explorador de Materiales',
    color: '#fb923c',
    resumen: 'Conoces los códigos y características de cada pieza.',
    veEn: [
      'Código identificador de cada pieza',
      'Peso, tamaño y tipo de material',
      'Restricciones de uso de las piezas',
    ],
    responsabilidad:
      'Indica qué piezas usar, cuáles son compatibles y cuáles tienen restricciones.',
  },
  constructor: {
    titulo: 'Constructor',
    color: '#f87171',
    resumen: 'No tienes plano. Eres el único que puede tocar las piezas físicas.',
    veEn: [
      'Las instrucciones de tus compañeros',
      'Las piezas físicas reales frente a ti',
      'Tu propia interpretación del diseño',
    ],
    responsabilidad:
      'Escucha, coordina la información de los tres exploradores y construye la torre.',
  },
}
