import { C, fonts } from '../theme';
import type { Screen } from '../types/game';
import { useGame } from '../context/GameContext';
import { roleData } from '../data/roleData';
import { Wrap } from '../components/ui/Wrap';
import { Label } from '../components/ui/Label';
import { Divider } from '../components/ui/Divider';
import { Block } from '../components/ui/Block';
import { Rule } from '../components/ui/Rule';
import { Btn } from '../components/ui/Button';

export function RoleScreen({ go }: { go: (s: Screen) => void }) {
  const { miRol } = useGame();
  if (!miRol) return null;
  const d = roleData[miRol];
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
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Label>Tu rol es...</Label>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: '50%',
              background: C.surface2,
              border: `2px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
            }}
          >
            {d.icon}
          </div>
          <div>
            <h1
              style={{
                fontFamily: fonts.display,
                fontWeight: 900,
                fontSize: 36,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: C.accent,
                margin: 0,
                lineHeight: 1,
              }}
            >
              {d.label}
            </h1>
          </div>
        </div>

        <Divider />

        <div
          style={{
            width: '100%',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <Block label="Información">
            <p style={{ fontSize: 14, color: '#c0b8b0', lineHeight: 1.6, margin: 0 }}>{d.info}</p>
          </Block>
          <Block label="Tu función">
            <p style={{ fontSize: 14, color: '#c0b8b0', lineHeight: 1.6, margin: 0 }}>
              {d.funcion}
            </p>
          </Block>
          <Block label="Recuerda">
            {d.rules.map(([ok, txt]) => (
              <Rule key={txt} ok={ok}>
                {txt}
              </Rule>
            ))}
          </Block>
        </div>

        <div style={{ width: '100%', marginTop: 'auto' }}>
          <Btn onClick={() => go('revelacion')}>Entendido</Btn>
        </div>
      </div>
    </Wrap>
  );
}
