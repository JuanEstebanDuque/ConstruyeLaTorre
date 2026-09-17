import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

export interface JugadorLobby {
  id: string;
  nombre: string;
  listo: boolean;
}

export async function getJugadores(partidaId: string): Promise<JugadorLobby[]> {
  const { data, error } = await supabase
    .from('jugadores')
    .select('id, nombre, listo')
    .eq('partida_id', partidaId)
    .order('id', { ascending: true });
  if (error) {
    throw error;
  }
  return data ?? [];
}

export function subscribeJugadores(partidaId: string, onChange: () => void): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`jugadores-${partidaId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'jugadores', filter: `partida_id=eq.${partidaId}` },
      onChange
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export async function marcarListo(jugadorId: string): Promise<void> {
  const { error } = await supabase.from('jugadores').update({ listo: true }).eq('id', jugadorId);
  if (error) {
    throw error;
  }
}

export async function iniciarPartida(partidaId: string): Promise<string> {
  const { data, error } = await supabase.rpc('iniciar_partida', { p_partida_id: partidaId });
  if (error) {
    throw error;
  }
  return data as string;
}
