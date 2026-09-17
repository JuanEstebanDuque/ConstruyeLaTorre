import { useEffect, useState } from 'react';
import { C, fonts } from '../theme';
import type { Screen } from '../types/game';
import { useGame } from '../context/GameContext';
import { getResultadosFinales, type ResultadosFinales } from '../api/final';
import { Wrap } from '../components/ui/Wrap';
import { Label } from '../components/ui/Label';
import { Block } from '../components/ui/Block';
import { Divider } from '../components/ui/Divider';
import { Btn } from '../components/ui/Button';

export function FinalScreen({ go }: { go: (s: Screen) => void }) {
  const { partidaId, reset } = useGame();
  const [resultados, setResultados] = useState<ResultadosFinales | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!partidaId) return;
    getResultadosFinales(partidaId)
      .then(setResultados)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar los resultados'));
  }, [partidaId]);

  const salir = () => {
    reset();
    go('home');
  };

  if (error) {
    return (
      <Wrap>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <p style={{ fontSize: 13, color: C.danger, textAlign: 'center' }}>{error}</p>
        </div>
      </Wrap>
    );
  }

  if (!resultados) {
    return (
      <Wrap>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Label>Calculando resultados...</Label>
        </div>
      </Wrap>
    );
  }

  const { victoria, rondasSuperadas, totalRondas, puntosColectivos, jugadores, mvp } = resultados;

  return (
    <Wrap>
      <div
        style={{
          paddingTop: 48,
          paddingBottom: 48,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{victoria ? '🏆' : '💔'}</div>
          <h1
            style={{
              fontFamily: fonts.display,
              fontWeight: 900,
              fontSize: 48,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: victoria ? C.accent : C.danger,
              margin: 0,
              lineHeight: 1,
            }}
          >
            {victoria ? '¡Victoria!' : 'Derrota'}
          </h1>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 6, fontFamily: fonts.mono }}>
            {rondasSuperadas} de {totalRondas} rondas superadas
          </p>
        </div>

        <Block label="Puntos colectivos">
          <span style={{ fontFamily: fonts.display, fontWeight: 900, fontSize: 48, color: C.text }}>
            {puntosColectivos}
          </span>
        </Block>

        {mvp && (
          <Block label="MVP de la construcción">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(245,166,35,0.2)',
                  border: `1px solid ${C.accent}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}
              >
                👑
              </div>
              <div>
                <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 22, color: C.text }}>
                  {mvp.nombre}
                </div>
                <div style={{ fontSize: 12, color: C.muted, fontFamily: fonts.mono }}>
                  {mvp.puntosAporte} Puntos de Aporte
                </div>
              </div>
            </div>
          </Block>
        )}

        <Block label="Resultados">
          {jugadores.map((r, i) => (
            <div
              key={r.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: fonts.mono, fontSize: 12, color: C.dimmed, width: 16 }}>
                  {i + 1}.
                </span>
                <span style={{ fontSize: 15, color: C.text }}>{r.nombre}</span>
              </div>
              <span
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 13,
                  color: r.puntosAporte > 0 ? C.accent : C.dimmed,
                }}
              >
                {r.puntosAporte} PA
              </span>
            </div>
          ))}
          <Divider />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
            <span style={{ fontSize: 13, color: C.muted }}>Penalizaciones</span>
            <span style={{ fontFamily: fonts.mono, fontSize: 13, color: C.text }}>
              0 (no implementado en este alcance)
            </span>
          </div>
        </Block>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
          <Btn onClick={salir}>Jugar de nuevo</Btn>
          <Btn onClick={salir} variant="ghost">
            Salir
          </Btn>
        </div>
      </div>
    </Wrap>
  );
}
