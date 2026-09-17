import { useState } from 'react';
import { C, fonts } from '../theme';
import type { Screen } from '../types/game';
import { useGame } from '../context/GameContext';
import { unirsePartida } from '../api/partidas';
import { Wrap } from '../components/ui/Wrap';
import { BackBtn } from '../components/ui/BackButton';
import { Label } from '../components/ui/Label';
import { Title } from '../components/ui/Title';
import { Block } from '../components/ui/Block';
import { Divider } from '../components/ui/Divider';
import { Btn } from '../components/ui/Button';

export function JoinCodeScreen({ go }: { go: (s: Screen) => void }) {
  const { setSesionPartida } = useGame();
  const [code, setCode] = useState('');
  const [nombre, setNombre] = useState('');
  const [uniendo, setUniendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unirse = async () => {
    if (code.length < 4 || !nombre.trim()) return;
    setUniendo(true);
    setError(null);
    try {
      const sesion = await unirsePartida(code, nombre.trim());
      setSesionPartida({ ...sesion, nombre: nombre.trim() });
      go('lobby');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo unir a la partida');
    } finally {
      setUniendo(false);
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
          <Label>Unirse a partida</Label>
          <div style={{ height: 6 }} />
          <Title>Ingresa el código</Title>
        </div>

        <Block>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="A7BX2"
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              outline: 'none',
              fontFamily: fonts.display,
              fontWeight: 900,
              fontSize: 40,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: C.text,
              caretColor: C.accent,
            }}
          />
          <Divider />
          <p style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>
            Código de 5 caracteres compartido por el anfitrión.
          </p>
        </Block>

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
          <Btn onClick={unirse} disabled={code.length < 4 || !nombre.trim() || uniendo}>
            {uniendo ? 'Uniendo...' : 'Unirme'}
          </Btn>
        </div>
      </div>
    </Wrap>
  );
}
