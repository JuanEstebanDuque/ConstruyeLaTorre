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
    imagen: string
    resumen: string
    informacion: string
    funcion: string
  }
> = {
  arquitecto: {
    titulo: 'Arquitecto',
    color: '#669524',
    imagen: '/RolArquitecto.png',
    resumen: 'Tienes la vista frontal de la torre: alturas y niveles.',
    informacion: 'Vista frontal de la torre, distribución general y alturas de los niveles.',
    funcion:
      'Interpreta la forma general de la estructura y orienta al equipo sobre cómo debería verse la torre.',
  },
  explorador_estructura: {
    titulo: 'Explorador de Estructura',
    color: '#3ee589',
    imagen: '/RolExploradorEstructura.png',
    resumen: 'Tienes la vista lateral y superior: cómo se conectan las piezas.',
    informacion: 'Vista lateral o superior de la torre, y relación, orientación y conexión entre piezas.',
    funcion:
      'Ayuda al equipo a determinar cómo deben ubicarse y orientarse las piezas dentro de la estructura.',
  },
  explorador_materiales: {
    titulo: 'Explorador de Materiales',
    color: '#a47b12',
    imagen: '/RolExploradorMateriales.png',
    resumen: 'Conoces los códigos y características de cada pieza.',
    informacion: 'Códigos, características e información de las piezas necesarias para la construcción.',
    funcion:
      'Identifica qué piezas deben utilizarse y orienta al equipo cuando aparezcan cambios o restricciones.',
  },
  constructor: {
    titulo: 'Constructor',
    color: '#245329',
    imagen: '/RolConstructor.png',
    resumen: 'No tienes plano. Eres el único que puede tocar las piezas físicas.',
    informacion: 'No tienes acceso al plano completo, solo a las instrucciones para ejecutar la construcción.',
    funcion:
      'Es el único autorizado para manipular y colocar las piezas físicas, siguiendo las indicaciones del equipo.',
  },
}
