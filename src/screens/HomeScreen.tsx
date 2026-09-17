import { C, fonts } from '../theme';
import type { Screen } from '../types/game';
import { Wrap } from '../components/ui/Wrap';
import { Btn } from '../components/ui/Button';
import { TowerFront } from '../components/ui/TowerArt';

export function HomeScreen({ go }: { go: (s: Screen) => void }) {
  return (
    <Wrap>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          paddingTop: 60,
          paddingBottom: 48,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 110,
              height: 110,
              border: `1px dashed ${C.border}`,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#1a1a2e',
            }}
          >
            <TowerFront />
          </div>
          <div>
            <h1
              style={{
                fontFamily: fonts.display,
                fontWeight: 900,
                fontSize: 52,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: C.text,
                margin: 0,
                lineHeight: 1,
              }}
            >
              Construye
            </h1>
            <h1
              style={{
                fontFamily: fonts.display,
                fontWeight: 900,
                fontSize: 52,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: C.accent,
                margin: 0,
                lineHeight: 1,
              }}
            >
              la Torre
            </h1>
            <p style={{ color: C.muted, fontSize: 13, marginTop: 12, letterSpacing: '0.1em' }}>
              Coopera · Comunica · Construye
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Btn onClick={() => go('create')}>Crear partida</Btn>
          <Btn onClick={() => go('join-code')} variant="ghost">
            Unirme a partida
          </Btn>
          <button
            onClick={() => {}}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: C.muted,
              fontSize: 13,
              fontFamily: fonts.mono,
              marginTop: 4,
            }}
          >
            ¿Cómo jugar?
          </button>
        </div>
      </div>
    </Wrap>
  );
}
