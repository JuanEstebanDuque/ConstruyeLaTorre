import { useEffect, useState } from 'react';
import { C } from '../theme';
import type { Screen } from '../types/game';
import { useGame } from '../context/GameContext';
import { enviarRespuestaValidacion } from '../api/rondas';
import { Wrap } from '../components/ui/Wrap';
import { BackBtn } from '../components/ui/BackButton';
import { Label } from '../components/ui/Label';
import { Title } from '../components/ui/Title';
import { Btn } from '../components/ui/Button';
import { Block } from '../components/ui/Block';

const corners: [string, string][] = [
  ['top', 'left'],
  ['top', 'right'],
  ['bottom', 'left'],
  ['bottom', 'right'],
];

export function ValidacionScreen({ go }: { go: (s: Screen) => void }) {
  const { miRol, rondaId, jugadorId } = useGame();
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!scanning) return;
    if (progress >= 100) {
      const t = setTimeout(() => {
        if (!rondaId || !jugadorId) return;
        enviarRespuestaValidacion(rondaId, jugadorId, true)
          .then(() => go('resultado-ronda'))
          .catch((err) => setError(err instanceof Error ? err.message : 'Error al enviar la validación'));
      }, 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setProgress((p) => Math.min(p + 8, 100)), 150);
    return () => clearTimeout(t);
  }, [scanning, progress, go, rondaId, jugadorId]);

  const responder = async (valor: boolean) => {
    if (!rondaId || !jugadorId) return;
    setEnviando(true);
    setError(null);
    try {
      await enviarRespuestaValidacion(rondaId, jugadorId, valor);
      go('resultado-ronda');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar la validación');
      setEnviando(false);
    }
  };

  if (miRol !== 'constructor') {
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
          <Label>Validación</Label>
          <Title sub>¿La torre quedó estable?</Title>
          <Block>
            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, margin: 0 }}>
              Responde en privado según lo que ves de la construcción física. El Constructor está
              validando desde su dispositivo al mismo tiempo.
            </p>
          </Block>
          {error && (
            <Block>
              <p style={{ fontSize: 13, color: C.danger, margin: 0 }}>{error}</p>
            </Block>
          )}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Btn onClick={() => responder(true)} disabled={enviando}>
              Sí
            </Btn>
            <Btn onClick={() => responder(false)} variant="ghost" disabled={enviando}>
              No
            </Btn>
          </div>
        </div>
      </Wrap>
    );
  }

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackBtn onClick={() => go('construccion')} />
          <Label>Validación</Label>
        </div>
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
          Coloca la torre dentro del área indicada.
        </p>

        <div
          style={{
            position: 'relative',
            background: '#0a0a0a',
            border: `2px dashed ${C.border}`,
            borderRadius: 8,
            aspectRatio: '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {corners.map(([v, h]) => {
            const cornerStyle: React.CSSProperties = {
              position: 'absolute',
              top: v === 'top' ? 12 : undefined,
              bottom: v === 'bottom' ? 12 : undefined,
              left: h === 'left' ? 12 : undefined,
              right: h === 'right' ? 12 : undefined,
              width: 24,
              height: 24,
              borderTop: v === 'top' ? `2px solid ${C.accent}` : 'none',
              borderBottom: v === 'bottom' ? `2px solid ${C.accent}` : 'none',
              borderLeft: h === 'left' ? `2px solid ${C.accent}` : 'none',
              borderRight: h === 'right' ? `2px solid ${C.accent}` : 'none',
            };
            return <div key={`${v}${h}`} style={cornerStyle} />;
          })}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🏗</div>
            <Label>Área cámara</Label>
            <p style={{ fontSize: 11, color: C.dimmed, marginTop: 4 }}>Torre</p>
          </div>
        </div>

        <p style={{ fontSize: 13, color: C.muted, textAlign: 'center' }}>Mantén la torre estable.</p>

        {scanning && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <Label>Detectando piezas...</Label>
              <Label accent>{progress}%</Label>
            </div>
            <div style={{ height: 4, background: C.border, borderRadius: 2 }}>
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: C.success,
                  borderRadius: 2,
                  transition: 'width 0.1s',
                }}
              />
            </div>
          </div>
        )}

        {error && (
          <Block>
            <p style={{ fontSize: 13, color: C.danger, margin: 0 }}>{error}</p>
          </Block>
        )}

        <div style={{ marginTop: 'auto' }}>
          {!scanning ? (
            <Btn onClick={() => setScanning(true)}>Iniciar escaneo</Btn>
          ) : (
            <Btn onClick={() => {}} disabled>
              Escaneando...
            </Btn>
          )}
        </div>
      </div>
    </Wrap>
  );
}
