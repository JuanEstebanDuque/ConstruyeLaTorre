import { useEffect, useState } from 'react';
import { C, fonts } from '../theme';
import type { Screen } from '../types/game';
import { useGame } from '../context/GameContext';
import { Wrap } from '../components/ui/Wrap';
import { Label } from '../components/ui/Label';
import { Title } from '../components/ui/Title';
import { Block } from '../components/ui/Block';
import { Divider } from '../components/ui/Divider';
import { Btn } from '../components/ui/Button';
import { RoundHeader } from '../components/ui/RoundHeader';
import { Rule } from '../components/ui/Rule';

export function PlaneacionScreen({ go }: { go: (s: Screen) => void }) {
  const { rondaNumero: round } = useGame();
  const [secs, setSecs] = useState(30);
  useEffect(() => {
    if (secs <= 0) return;
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);
  const done = secs === 0;

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
        <RoundHeader round={`Ronda ${round} de 3`} />
        <div>
          <Label accent>Planeación</Label>
          <div style={{ height: 4 }} />
          <Title sub>Organícense</Title>
        </div>

        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <span
            style={{
              fontFamily: fonts.mono,
              fontSize: 54,
              fontWeight: 700,
              color: done ? C.danger : secs < 10 ? C.accent : C.text,
            }}
          >
            00:{String(secs).padStart(2, '0')}
          </span>
        </div>

        <Block>
          <div style={{ display: 'flex', justifyContent: 'center', fontSize: 32, marginBottom: 12 }}>
            💬
          </div>
          <p
            style={{
              fontSize: 14,
              color: '#c0b8b0',
              lineHeight: 1.7,
              margin: 0,
              textAlign: 'center',
            }}
          >
            Comparte verbalmente la información de tu rol.
            <br />
            Organícense antes de comenzar la construcción.
          </p>
        </Block>

        <Divider />

        <Block label="No olvides">
          <Rule ok={false}>No mostrar pantallas</Rule>
          <Rule ok={false}>No intercambiar celulares</Rule>
          <Rule ok={true}>Comunicación verbal</Rule>
        </Block>

        <div style={{ marginTop: 'auto' }}>
          <Btn onClick={() => go('construccion')}>
            {done ? '¡Iniciar construcción!' : 'Saltar planeación'}
          </Btn>
        </div>
      </div>
    </Wrap>
  );
}
