import { useEffect, useState } from 'react';
import { C } from '../theme';
import type { PlanoContenido, Screen } from '../types/game';
import { useGame } from '../context/GameContext';
import { getMiPlano } from '../api/rondas';
import { Wrap } from '../components/ui/Wrap';
import { Label } from '../components/ui/Label';
import { Title } from '../components/ui/Title';
import { Block } from '../components/ui/Block';
import { Btn } from '../components/ui/Button';
import { RoundHeader } from '../components/ui/RoundHeader';
import { PlanoContent } from '../components/PlanoContent';

export function RevelacionScreen({ go }: { go: (s: Screen) => void }) {
  const { rondaId, jugadorId, miRol, rondaNumero } = useGame();
  const [plano, setPlano] = useState<PlanoContenido | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rondaId || !jugadorId || miRol === 'constructor') return;
    getMiPlano(rondaId, jugadorId)
      .then(setPlano)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar tu información'));
  }, [rondaId, jugadorId, miRol]);

  if (!miRol) return null;

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
        <RoundHeader round={`Ronda ${rondaNumero} de 3`} />
        <div>
          <Label accent>Revelación</Label>
          <div style={{ height: 4 }} />
          <Title sub>Tu información</Title>
        </div>
        {error ? (
          <Block>
            <p style={{ fontSize: 13, color: C.danger, margin: 0 }}>{error}</p>
          </Block>
        ) : (
          <PlanoContent role={miRol} plano={plano} />
        )}
        <Block>
          <p style={{ fontSize: 13, color: C.danger, margin: 0 }}>⚠ No muestres esta pantalla.</p>
        </Block>
        <div style={{ marginTop: 'auto' }}>
          <Btn onClick={() => go('planeacion')}>Estoy listo</Btn>
        </div>
      </div>
    </Wrap>
  );
}
