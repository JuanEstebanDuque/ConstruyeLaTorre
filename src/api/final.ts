import { supabase } from '../lib/supabaseClient';

export interface ResultadoJugador {
  id: string;
  nombre: string;
  puntosAporte: number;
}

export interface ResultadosFinales {
  rondasSuperadas: number;
  totalRondas: number;
  puntosColectivos: number;
  victoria: boolean;
  jugadores: ResultadoJugador[];
  mvp: ResultadoJugador | null;
}

interface ConteoVotoFila {
  jugador_id: string;
  votos: number;
}

export async function getResultadosFinales(partidaId: string): Promise<ResultadosFinales> {
  const { data: rondas, error: errRondas } = await supabase
    .from('rondas')
    .select('id, resultado_estable, puntos_ronda')
    .eq('partida_id', partidaId);
  if (errRondas) {
    throw errRondas;
  }

  const { data: jugadoresDb, error: errJugadores } = await supabase
    .from('jugadores')
    .select('id, nombre')
    .eq('partida_id', partidaId);
  if (errJugadores) {
    throw errJugadores;
  }

  const rondasSuperadas = (rondas ?? []).filter((r) => r.resultado_estable === true).length;
  const puntosColectivos = (rondas ?? []).reduce((sum, r) => sum + (r.puntos_ronda ?? 0), 0);

  const votosPorJugador = new Map<string, number>();
  for (const ronda of rondas ?? []) {
    const { data: conteo, error: errConteo } = await supabase.rpc('conteo_votos_ronda', {
      p_ronda_id: ronda.id,
    });
    if (errConteo) {
      throw errConteo;
    }
    for (const fila of (conteo ?? []) as ConteoVotoFila[]) {
      votosPorJugador.set(fila.jugador_id, (votosPorJugador.get(fila.jugador_id) ?? 0) + Number(fila.votos));
    }
  }

  const jugadores: ResultadoJugador[] = (jugadoresDb ?? [])
    .map((j) => ({ id: j.id, nombre: j.nombre, puntosAporte: votosPorJugador.get(j.id) ?? 0 }))
    .sort((a, b) => b.puntosAporte - a.puntosAporte);

  const mvp = jugadores.length > 0 && jugadores[0].puntosAporte > 0 ? jugadores[0] : null;

  return {
    rondasSuperadas,
    totalRondas: rondas?.length ?? 0,
    puntosColectivos,
    victoria: rondasSuperadas >= 2,
    jugadores,
    mvp,
  };
}
