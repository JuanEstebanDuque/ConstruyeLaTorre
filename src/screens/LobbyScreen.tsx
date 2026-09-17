import { useEffect, useState } from 'react';
import { C, fonts } from '../theme';
import type { Screen } from '../types/game';
import { useGame } from '../context/GameContext';
import { getJugadores, iniciarPartida, marcarListo, subscribeJugadores, type JugadorLobby } from '../api/lobby';
import { getMiAsignacion } from '../api/rondas';
import { Wrap } from '../components/ui/Wrap';
import { BackBtn } from '../components/ui/BackButton';
import { Label } from '../components/ui/Label';
import { Block } from '../components/ui/Block';
import { Btn } from '../components/ui/Button';

export function LobbyScreen({ go }: { go: (s: Screen) => void }) {
  const { partidaId, jugadorId, codigoSala, setRonda } = useGame();
  const [jugadores, setJugadores] = useState<JugadorLobby[]>([]);
  const [marcando, setMarcando] = useState(false);
  const [iniciando, setIniciando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!partidaId) return;
    const refetch = () => {
      getJugadores(partidaId)
        .then(setJugadores)
        .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar jugadores'));
    };
    refetch();
    const unsubscribe = subscribeJugadores(partidaId, refetch);
    return unsubscribe;
  }, [partidaId]);

  const yo = jugadores.find((j) => j.id === jugadorId);
  const todosListos = jugadores.length === 4 && jugadores.every((j) => j.listo);

  const estoyListo = async () => {
    if (!jugadorId) return;
    setMarcando(true);
    try {
      await marcarListo(jugadorId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al marcarte como listo');
    } finally {
      setMarcando(false);
    }
  };

  const continuar = async () => {
    if (!partidaId || !jugadorId) return;
    setIniciando(true);
    setError(null);
    try {
      const rondaId = await iniciarPartida(partidaId);
      const miRol = await getMiAsignacion(rondaId, jugadorId);
      setRonda({ rondaId, rondaNumero: 1, miRol });
      go('role');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar la partida');
      setIniciando(false);
    }
  };

  return (
    <Wrap>
      <div
        style={{
          paddingTop: 16,
          paddingBottom: 40,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 40,
          }}
        >
          <BackBtn onClick={() => go('home')} />
          <Label>Lobby</Label>
          <div style={{ width: 50 }} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <Label>Código de sala</Label>
          <div style={{ height: 4 }} />
          <span
            style={{
              fontFamily: fonts.display,
              fontWeight: 900,
              fontSize: 40,
              letterSpacing: '0.3em',
              color: C.accent,
            }}
          >
            {codigoSala}
          </span>
        </div>

        <Block>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <Label>Jugadores</Label>
            <Label accent>{jugadores.length}/4</Label>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {jugadores.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '11px 0',
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: p.listo ? C.success : C.dimmed, fontSize: 8 }}>●</span>
                  <span style={{ fontSize: 15, color: C.text }}>{p.nombre}</span>
                </div>
                <span style={{ fontSize: 13, color: p.listo ? C.success : C.muted }}>
                  {p.listo ? '✓ Listo' : 'Espera'}
                </span>
              </div>
            ))}
          </div>
        </Block>

        <Block>
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
            <span style={{ color: C.accent }}>Recuerda:</span>
            <br />
            no muestres tu pantalla durante la partida.
          </p>
        </Block>

        {error && (
          <Block>
            <p style={{ fontSize: 13, color: C.danger, margin: 0 }}>{error}</p>
          </Block>
        )}

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {todosListos ? (
            <Btn onClick={continuar} disabled={iniciando}>
              {iniciando ? 'Iniciando...' : 'Continuar →'}
            </Btn>
          ) : (
            <Btn onClick={estoyListo} disabled={!yo || yo.listo || marcando}>
              {yo?.listo ? 'Esperando a los demás...' : 'Estoy listo'}
            </Btn>
          )}
        </div>
      </div>
    </Wrap>
  );
}
