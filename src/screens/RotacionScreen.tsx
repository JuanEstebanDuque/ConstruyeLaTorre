import { useEffect, useState } from 'react';
import { C, fonts } from '../theme';
import type { Role, Screen } from '../types/game';
import { useGame } from '../context/GameContext';
import { getMiAsignacion, rotarRonda } from '../api/rondas';
import { roleData } from '../data/roleData';
import { Wrap } from '../components/ui/Wrap';
import { Label } from '../components/ui/Label';
import { Title } from '../components/ui/Title';
import { Block } from '../components/ui/Block';
import { Btn } from '../components/ui/Button';

export function RotacionScreen({ go }: { go: (s: Screen) => void }) {
  const { partidaId, jugadorId, rondaNumero, setRonda } = useGame();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextRole, setNextRole] = useState<Role | null>(null);
  const [nextRondaId, setNextRondaId] = useState<string | null>(null);

  useEffect(() => {
    if (!partidaId || !jugadorId) return;
    let cancelled = false;
    (async () => {
      try {
        const rondaId = await rotarRonda(partidaId);
        const rol = await getMiAsignacion(rondaId, jugadorId);
        if (!cancelled) {
          setNextRondaId(rondaId);
          setNextRole(rol);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al rotar de ronda');
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [partidaId, jugadorId]);

  const continuar = () => {
    if (!nextRondaId || !nextRole) return;
    setRonda({ rondaId: nextRondaId, rondaNumero: rondaNumero + 1, miRol: nextRole });
    go('revelacion');
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

  if (loading || !nextRole) {
    return (
      <Wrap>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Label>Preparando la siguiente ronda...</Label>
        </div>
      </Wrap>
    );
  }

  const d = roleData[nextRole];
  return (
    <Wrap>
      <div
        style={{
          paddingTop: 56,
          paddingBottom: 40,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Label>Ronda {rondaNumero + 1} de 3</Label>
          <div style={{ height: 6 }} />
          <Title sub>Nuevo rol</Title>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: C.surface2,
              border: `2px solid ${C.accent}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
            }}
          >
            {d.icon}
          </div>
          <h2
            style={{
              fontFamily: fonts.display,
              fontWeight: 900,
              fontSize: 30,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: C.accent,
              margin: 0,
            }}
          >
            {d.label}
          </h2>
          <p style={{ fontSize: 14, color: '#c0b8b0', lineHeight: 1.6 }}>{d.info}</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', fontSize: 24, color: C.muted }}>↓</div>

        <Block>
          <p style={{ fontSize: 14, color: '#c0b8b0', lineHeight: 1.6, margin: 0 }}>
            Prepárate para el desafío final.
          </p>
        </Block>

        <div style={{ marginTop: 'auto' }}>
          <Btn onClick={continuar}>Continuar</Btn>
        </div>
      </div>
    </Wrap>
  );
}
