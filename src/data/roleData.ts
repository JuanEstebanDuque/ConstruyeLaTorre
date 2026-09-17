import type { Role, RoleInfo } from '../types/game';

export const roleData: Record<Role, RoleInfo> = {
  arquitecto: {
    label: 'Arquitecto',
    icon: '🏗',
    info: 'Vista frontal de la torre, niveles y alturas.',
    funcion: 'Ayuda al equipo a entender la forma general de la estructura.',
    rules: [
      [false, 'No muestres tu pantalla'],
      [false, 'No puedes tocar piezas'],
      [true, 'Comunica verbalmente'],
    ],
  },
  estructura: {
    label: 'Explorador de Estructura',
    icon: '🔭',
    info: 'Vista lateral o superior, orientación y relaciones entre piezas.',
    funcion: 'Describe la disposición espacial y orientación de los bloques.',
    rules: [
      [false, 'No muestres tu pantalla'],
      [false, 'No puedes tocar piezas'],
      [true, 'Comunica verbalmente'],
    ],
  },
  materiales: {
    label: 'Explorador de Materiales',
    icon: '📦',
    info: 'Códigos y características de las piezas requeridas.',
    funcion: 'Informa al equipo qué piezas se necesitan y sus propiedades.',
    rules: [
      [false, 'No muestres tu pantalla'],
      [false, 'No puedes tocar piezas'],
      [true, 'Comunica verbalmente'],
    ],
  },
  constructor: {
    label: 'Constructor',
    icon: '🔧',
    info: 'Instrucciones para ejecutar la construcción sin ver el plano completo.',
    funcion: 'Eres el único que puede manipular las piezas físicamente.',
    rules: [
      [true, 'Escucha a tus compañeros'],
      [false, 'No puedes ver el plano completo'],
      [true, 'Comunica tus acciones'],
    ],
  },
};

export const roleRotation: Record<Role, Role> = {
  arquitecto: 'estructura',
  estructura: 'materiales',
  materiales: 'constructor',
  constructor: 'arquitecto',
};
