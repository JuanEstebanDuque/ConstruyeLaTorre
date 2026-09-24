export type Rol =
  | 'arquitecto'
  | 'explorador_estructura'
  | 'explorador_materiales'
  | 'constructor'

export const TOTAL_RONDAS = 3
export const TIEMPO_PLANEACION_SEG = 30
export const TIEMPO_CONSTRUCCION_SEG = 210
/** Una ronda se supera con al menos esta cantidad de condiciones cumplidas (de 4). */
export const CONDICIONES_MINIMAS = 2
/** Con esta cantidad de jugadores listos en planeación empieza el juego para todos. */
export const LISTOS_PARA_JUGAR = 3
/** La partida se gana superando al menos esta cantidad de rondas. */
export const RONDAS_PARA_GANAR = 2

export interface Partida {
  id: string
  codigo_sala: string
  creada_en: string
  creada_por: string | null
  iniciada_en: string | null
  terminada_en: string | null
  ronda_actual: number
}

export interface Jugador {
  id: string
  partida_id: string
  auth_user_id: string
  nombre: string
  unido_en: string
}

export interface Ronda {
  id: string
  partida_id: string
  numero: number
  evento_tipo: string | null
  torre_correcta: boolean | null
  torre_estable: boolean | null
  evento_cumplido: boolean | null
  dentro_tiempo: boolean | null
  superada: boolean | null
  validada_en: string | null
  /** Lo fija el creador al pasar de Revelación a Planeación (reloj global) */
  planeacion_inicio: string | null
  /** Momento común en que todos empiezan a jugar */
  juego_inicio: string | null
}

export interface SesionLocal {
  jugadorId: string
  partidaId: string
  codigoSala: string
  nombre: string
  esHost: boolean
}

// ── Fragmentos privados del plano (uno por rol, generados en el servidor) ──

export interface FragmentoArquitecto {
  niveles: { nivel: number; piezas: number }[]
}

export interface FragmentoEstructura {
  /** 9 celdas de la placa base 3x3, fila por fila; true = ocupada */
  vista_superior: boolean[]
  /** Altura (en piezas) de cada fila de la placa, vista desde un costado */
  vista_lateral: number[]
  orientaciones: { codigo: string; orientacion: 'horizontal' | 'vertical' }[]
  conexiones: string
}

export interface FragmentoMateriales {
  piezas: { codigo: string; cantidad: number; descripcion: string }[]
}

export type Fragmento = FragmentoArquitecto | FragmentoEstructura | FragmentoMateriales | Record<string, never>

export interface Evento {
  tipo: 'pieza_bloqueada' | 'cambio_altura' | 'silencio' | 'plano_perdido' | 'reemplazo'
  titulo: string
  descripcion: string
  /** segundos que dura el efecto (silencio, plano perdido) */
  duracion?: number
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
    personaje: {
      nombre: string
      epiteto: string
      historia: string
      /** color de acento del personaje (cristales, luces) */
      acento: string
    }
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
    personaje: {
      nombre: 'Kaia',
      epiteto: 'la Guardiana Raíz',
      historia:
        'Antiguo roble injertado con un núcleo de proyección holográfica en su corteza. Ve la forma completa del Nodo como la ve un árbol madre: la silueta general, los niveles, cómo debe crecer la estructura — pero no puede tocar nada, solo señalar el camino a través de zarcillos de luz que proyecta desde sus ramas.',
      acento: '#f2a93b',
    },
  },
  explorador_estructura: {
    titulo: 'Explorador de Estructura',
    color: '#3ee589',
    imagen: '/RolExploradorEstructura.png',
    resumen: 'Tienes la vista lateral y superior: cómo se conectan las piezas.',
    informacion: 'Vista lateral o superior de la torre, y relación, orientación y conexión entre piezas.',
    funcion:
      'Ayuda al equipo a determinar cómo deben ubicarse y orientarse las piezas dentro de la estructura.',
    personaje: {
      nombre: 'Vero',
      epiteto: 'el Explorador Alado',
      historia:
        'Colibrí aumentado con un exoesqueleto de vuelo estabilizado. Recorre el espacio entre piezas, entendiendo cómo se conectan entre sí desde ángulos que nadie más ve — orientación, huecos, relaciones espaciales. Habla rápido y en fragmentos, como su vuelo.',
      acento: '#35d7c8',
    },
  },
  explorador_materiales: {
    titulo: 'Explorador de Materiales',
    color: '#a47b12',
    imagen: '/RolExploradorMateriales.png',
    resumen: 'Conoces los códigos y características de cada pieza.',
    informacion: 'Códigos, características e información de las piezas necesarias para la construcción.',
    funcion:
      'Identifica qué piezas deben utilizarse y orienta al equipo cuando aparezcan cambios o restricciones.',
    personaje: {
      nombre: 'Bruma',
      epiteto: 'la Tejedora Subterránea',
      historia:
        'Hongo micélico que creció alrededor de un escáner de composición recuperado de las ruinas. No se mueve mucho, pero "siente" qué material es cada pieza con solo rozarla — identifica códigos, texturas, qué combinaciones son compatibles y cuáles romperán la estructura.',
      acento: '#9b6bf2',
    },
  },
  constructor: {
    titulo: 'Constructor',
    color: '#245329',
    imagen: '/RolConstructor.png',
    resumen: 'No tienes plano. Eres el único que puede tocar las piezas físicas.',
    informacion: 'No tienes acceso al plano completo, solo a las instrucciones para ejecutar la construcción.',
    funcion:
      'Es el único autorizado para manipular y colocar las piezas físicas, siguiendo las indicaciones del equipo.',
    personaje: {
      nombre: 'Tocón',
      epiteto: 'el Constructor de Manos Firmes',
      historia:
        'Castor con extremidades delanteras reemplazadas por brazos mecánicos de precisión, recuperados de maquinaria industrial abandonada. Es el único que puede tocar las piezas físicas — pero no ve el plano. Todo lo que sabe se lo tienen que decir los demás, pieza por pieza.',
      acento: '#f28a2e',
    },
  },
}
