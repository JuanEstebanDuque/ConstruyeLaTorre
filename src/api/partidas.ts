import { supabase } from '../lib/supabaseClient';

// Sin caracteres ambiguos (0/O, 1/I).
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generarCodigo(): string {
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export interface SesionCreada {
  partidaId: string;
  jugadorId: string;
  codigoSala: string;
}

export async function crearPartida(nombre: string): Promise<SesionCreada> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Sesión no iniciada');
  }

  let lastError: unknown = null;
  for (let intento = 0; intento < 5; intento++) {
    const codigoSala = generarCodigo();
    const { data, error } = await supabase
      .from('partidas')
      .insert({ codigo_sala: codigoSala })
      .select('id, codigo_sala')
      .single();

    if (!error && data) {
      const { data: jugador, error: errJugador } = await supabase
        .from('jugadores')
        .insert({ partida_id: data.id, auth_user_id: user.id, nombre })
        .select('id')
        .single();
      if (errJugador || !jugador) {
        throw errJugador ?? new Error('No se pudo crear el jugador');
      }
      return { partidaId: data.id, jugadorId: jugador.id, codigoSala: data.codigo_sala };
    }
    lastError = error;
  }
  throw lastError ?? new Error('No se pudo generar un código de sala único');
}

export async function unirsePartida(codigo: string, nombre: string): Promise<SesionCreada> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Sesión no iniciada');
  }

  const { data: partida, error: errPartida } = await supabase
    .from('partidas')
    .select('id, codigo_sala')
    .eq('codigo_sala', codigo.toUpperCase())
    .maybeSingle();

  if (errPartida) {
    throw errPartida;
  }
  if (!partida) {
    throw new Error('No existe ninguna partida con ese código');
  }

  const { data: jugador, error: errJugador } = await supabase
    .from('jugadores')
    .insert({ partida_id: partida.id, auth_user_id: user.id, nombre })
    .select('id')
    .single();
  if (errJugador || !jugador) {
    throw errJugador ?? new Error('No se pudo unir a la partida');
  }

  return { partidaId: partida.id, jugadorId: jugador.id, codigoSala: partida.codigo_sala };
}
