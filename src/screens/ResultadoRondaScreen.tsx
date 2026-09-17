import { useEffect, useState } from 'react';
import { C, fonts } from '../theme';
import type { Screen } from '../types/game';
import { useGame } from '../context/GameContext';
import { getRonda, subscribeRonda, type RondaFila } from '../api/rondas';
import { Wrap } from '../components/ui/Wrap';
import { Label } from '../components/ui/Label';
import { Block } from '../components/ui/Block';
import { Btn } from '../components/ui/Button';

export function ResultadoRondaScreen({ go }: { go: (s: Screen) => void }) {
  const { rondaId, rondaNumero } = useGame();
  const [ronda, setRonda] = useState<RondaFila | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rondaId) return;
    let cancelled = false;
    getRonda(rondaId)
      .then((r) => {
        if (!cancelled) setRonda(r);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar el resultado'));
    const unsubscribe = subscribeRonda(rondaId, (r) => setRonda(r));
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [rondaId]);

  if (error) {
    return (
      <Wrap>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <p style={{ fontSize: 13, color: C.danger, textAlign: 'center' }}>{error}</p>
        </div>
      </Wrap>
    );
  }

  if (!ronda || ronda.resultado_estable === null) {
    return (
      <Wrap>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <Label>Esperando a los demás jugadores...</Label>
        </div>
      </Wrap>
    );
  }

  const superada = ronda.resultado_estable;

  return (
    <Wrap>
      <div
        style={{
          paddingTop: 56,
          paddingBottom: 40,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div
          style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: superada ? 'rgba(92,184,92,0.15)' : 'rgba(224,82,82,0.15)',
              border: `2px solid ${superada ? C.success : C.danger}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
            }}
          >
            {superada ? '✓' : '✕'}
          </div>
          <h2
            style={{
              fontFamily: fonts.display,
              fontWeight: 900,
              fontSize: 32,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: superada ? C.success : C.danger,
              margin: 0,
            }}
          >
            {superada ? 'Ronda superada' : 'Ronda no superada'}
          </h2>
          {superada && (
            <div
              style={{
                background: 'rgba(92,184,92,0.1)',
                border: `1px solid ${C.success}`,
                borderRadius: 4,
                padding: '6px 16px',
              }}
            >
              <span style={{ fontSize: 14, color: C.success }}>+{ronda.puntos_ronda} punto colectivo</span>
            </div>
          )}
        </div>

        <Block label="Validación">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: C.muted }}>Torre estable (mayoría del equipo)</span>
            <span style={{ color: superada ? C.success : C.danger }}>{superada ? '✓' : '✕'}</span>
          </div>
        </Block>

        <Block>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Label>Marcador del equipo</Label>
            <span style={{ fontFamily: fonts.mono, fontSize: 16, color: C.accent, fontWeight: 700 }}>
              Ronda {rondaNumero} / 3
            </span>
          </div>
        </Block>

        <div style={{ marginTop: 'auto' }}>
          <Btn onClick={() => go('votacion')}>Continuar</Btn>
        </div>
      </div>
    </Wrap>
  );
}
