import { useEffect, useState } from 'react';
import { C, fonts } from '../theme';
import type { Screen } from '../types/game';
import { useGame } from '../context/GameContext';
import { crearPartida } from '../api/partidas';
import { getJugadores, subscribeJugadores } from '../api/lobby';
import { Wrap } from '../components/ui/Wrap';
import { BackBtn } from '../components/ui/BackButton';
import { Label } from '../components/ui/Label';
import { Title } from '../components/ui/Title';
import { Block } from '../components/ui/Block';
import { Btn } from '../components/ui/Button';

export function CreateScreen({ go }: { go: (s: Screen) => void }) {
  const { partidaId, codigoSala, setSesionPartida } = useGame();
  const [nombre, setNombre] = useState('');
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conectados, setConectados] = useState(1);

  useEffect(() => {
    if (!partidaId) return;
    const refetch = () => {
      getJugadores(partidaId)
        .then((js) => setConectados(js.length))
        .catch(() => {});
    };
    refetch();
    const unsubscribe = subscribeJugadores(partidaId, refetch);
    return unsubscribe;
  }, [partidaId]);

  const crear = async () => {
    if (!nombre.trim()) return;
    setCreando(true);
    setError(null);
    try {
      const sesion = await crearPartida(nombre.trim());
      setSesionPartida({ ...sesion, nombre: nombre.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la partida');
    } finally {
      setCreando(false);
    }
  };

  const copiar = () => {
    if (codigoSala) {
      navigator.clipboard?.writeText(codigoSala).catch(() => {});
    }
  };

  return (
    <Wrap>
      <div
        style={{
          paddingTop: 56,
          paddingBottom: 48,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >
        <BackBtn onClick={() => go('home')} />
        <div>
          <Label>Nueva partida</Label>
          <div style={{ height: 6 }} />
          <Title>Crear partida</Title>
        </div>

        {!codigoSala ? (
          <>
            <Block label="Tu nombre">
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value.slice(0, 30))}
                placeholder="¿Cómo te llamas?"
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  fontFamily: fonts.display,
                  fontWeight: 800,
                  fontSize: 22,
                  color: C.text,
                  caretColor: C.accent,
                }}
              />
            </Block>
            {error && (
              <Block>
                <p style={{ fontSize: 13, color: C.danger, margin: 0 }}>{error}</p>
              </Block>
            )}
            <div style={{ marginTop: 'auto' }}>
              <Btn onClick={crear} disabled={!nombre.trim() || creando}>
                {creando ? 'Creando...' : 'Generar código'}
              </Btn>
            </div>
          </>
        ) : (
          <>
            <Block label="Código de sala generado">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontFamily: fonts.display,
                    fontWeight: 900,
                    fontSize: 36,
                    letterSpacing: '0.2em',
                    color: C.text,
                  }}
                >
                  {codigoSala}
                </span>
                <button
                  onClick={copiar}
                  style={{
                    background: 'none',
                    border: `1px solid ${C.border}`,
                    borderRadius: 4,
                    padding: '6px 12px',
                    cursor: 'pointer',
                    color: C.muted,
                    fontSize: 12,
                    fontFamily: fonts.mono,
                  }}
                >
                  copiar
                </button>
              </div>
              <p style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>
                Comparte este código con tus compañeros.
              </p>
            </Block>

            <Block label="Jugadores">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: C.muted }}>Conectados</span>
                <span style={{ fontSize: 14, color: C.text }}>{conectados}/4</span>
              </div>
              <p style={{ fontSize: 12, color: C.dimmed, marginTop: 8 }}>
                Esperando que se unan los demás jugadores...
              </p>
            </Block>

            <div style={{ marginTop: 'auto' }}>
              <Btn onClick={() => go('lobby')}>Continuar al lobby</Btn>
            </div>
          </>
        )}
      </div>
    </Wrap>
  );
}
