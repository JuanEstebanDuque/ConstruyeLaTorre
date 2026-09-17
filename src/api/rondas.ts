import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { dbRoleToApp } from '../lib/roles';
import type { EventoContenido, PlanoContenido, Role } from '../types/game';

export async function getMiAsignacion(rondaId: string, jugadorId: string): Promise<Role> {
  const { data, error } = await supabase
    .from('asignaciones_rol')
    .select('rol')
    .eq('ronda_id', rondaId)
    .eq('jugador_id', jugadorId)
    .single();
  if (error) {
    throw error;
  }
  return dbRoleToApp(data.rol);
}

export async function getMiPlano(rondaId: string, jugadorId: string): Promise<PlanoContenido | null> {
  const { data, error } = await supabase
    .from('entregas_privadas')
    .select('contenido')
    .eq('ronda_id', rondaId)
    .eq('jugador_id', jugadorId)
    .eq('tipo', 'fragmento_plano')
    .maybeSingle();
  if (error) {
    throw error;
  }
  return (data?.contenido as PlanoContenido) ?? null;
}

export async function getMiEvento(rondaId: string, jugadorId: string): Promise<EventoContenido | null> {
  const { data, error } = await supabase
    .from('entregas_privadas')
    .select('contenido')
    .eq('ronda_id', rondaId)
    .eq('jugador_id', jugadorId)
    .eq('tipo', 'evento')
    .maybeSingle();
  if (error) {
    throw error;
  }
  return (data?.contenido as EventoContenido) ?? null;
}

export async function actualizarFase(rondaId: string, fase: string): Promise<void> {
  const { error } = await supabase.from('rondas').update({ fase }).eq('id', rondaId);
  if (error) {
    throw error;
  }
}

export interface RondaFila {
  id: string;
  fase: string;
  resultado_estable: boolean | null;
  puntos_ronda: number;
}

export async function getRonda(rondaId: string): Promise<RondaFila> {
  const { data, error } = await supabase
    .from('rondas')
    .select('id, fase, resultado_estable, puntos_ronda')
    .eq('id', rondaId)
    .single();
  if (error) {
    throw error;
  }
  return data;
}

export function subscribeRonda(rondaId: string, onChange: (ronda: RondaFila) => void): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`ronda-${rondaId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'rondas', filter: `id=eq.${rondaId}` },
      (payload) => onChange(payload.new as RondaFila)
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export async function enviarRespuestaValidacion(
  rondaId: string,
  jugadorId: string,
  respuesta: boolean
): Promise<void> {
  const { error } = await supabase
    .from('respuestas_validacion')
    .insert({ ronda_id: rondaId, jugador_id: jugadorId, respuesta_bool: respuesta });
  if (error) {
    throw error;
  }
}

export async function enviarVoto(rondaId: string, jugadorId: string, votadoId: string): Promise<void> {
  const { error } = await supabase
    .from('votos_aporte')
    .insert({ ronda_id: rondaId, jugador_id: jugadorId, votado_id: votadoId });
  if (error) {
    throw error;
  }
}

export async function rotarRonda(partidaId: string): Promise<string> {
  const { data, error } = await supabase.rpc('rotar_ronda', { p_partida_id: partidaId });
  if (error) {
    throw error;
  }
  return data as string;
}
