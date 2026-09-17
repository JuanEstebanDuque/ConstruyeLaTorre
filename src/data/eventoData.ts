import type { EventoTipo } from '../types/game';

interface EventoInfo {
  titulo: string;
  icono: string;
  descripcion: string;
}

export const EVENTO_INFO: Record<EventoTipo, EventoInfo> = {
  pieza_bloqueada: {
    titulo: 'Pieza bloqueada',
    icono: '⛔',
    descripcion:
      'Una de las piezas asignadas no puede utilizarse temporalmente. El equipo deberá encontrar una alternativa válida.',
  },
  cambio_altura: {
    titulo: 'Cambio de altura',
    icono: '📏',
    descripcion:
      'La altura objetivo de la torre cambió. Ajusten la construcción para cumplir con la nueva meta.',
  },
  silencio: {
    titulo: 'Silencio',
    icono: '🤐',
    descripcion:
      'Durante los próximos segundos el equipo debe comunicarse solo con señas, sin hablar.',
  },
  plano_perdido: {
    titulo: 'Plano perdido',
    icono: '🗺️',
    descripcion:
      'Un jugador perdió temporalmente el acceso a su información. El resto del equipo debe guiarlo.',
  },
  reemplazo_pieza: {
    titulo: 'Reemplazo de pieza',
    icono: '🔄',
    descripcion:
      'Una pieza debe ser reemplazada por otra distinta a la planeada originalmente.',
  },
};
