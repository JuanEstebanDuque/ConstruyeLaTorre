import { useEffect, useState } from 'react';
import { C, fonts } from '../theme';
import type { Role, Screen } from '../types/game';
import { useGame } from '../context/GameContext';
import { getJugadores } from '../api/lobby';
import { enviarVoto, getMiAsignacion } from '../api/rondas';
import { roleData } from '../data/roleData';
import { Wrap } from '../components/ui/Wrap';
import { Label } from '../components/ui/Label';
import { Block } from '../components/ui/Block';
import { Btn } from '../components/ui/Button';

interface Candidato {
  id: string;
  nombre: string;
  rol: Role | null;
}

export function VotacionScreen({ go }: { go: (s: Screen) => void }) {
  const { rondaId, rondaNumero, jugadorId, partidaId } = useGame();
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [vote, setVote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!partidaId || !jugadorId || !rondaId) return;
    getJugadores(partidaId)
      .then(async (js) => {
        const otros = js.filter((j) => j.id !== jugadorId);
        const conRol = await Promise.all(
          otros.map(async (j) => {
            try {
              const rol = await getMiAsignacion(rondaId, j.id);
              return { id: j.id, nombre: j.nombre, rol };
            } catch {
              return { id: j.id, nombre: j.nombre, rol: null };
            }
          })
        );
        setCandidatos(conRol);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar jugadores'));
  }, [partidaId, jugadorId, rondaId]);

  const enviar = async () => {
    if (!rondaId || !jugadorId || !vote) return;
    setEnviando(true);
    setError(null);
    try {
      await enviarVoto(rondaId, jugadorId, vote);
      go(rondaNumero < 3 ? 'rotacion' : 'final');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el voto');
      setEnviando(false);
    }
  };

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
        <Label accent>Aporte del equipo</Label>
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
          ¿Qué compañero consideras que tuvo un aporte clave durante esta ronda?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {candidatos.map((c) => (
            <button
              key={c.id}
              onClick={() => setVote(c.id)}
              style={{
                background: vote === c.id ? 'rgba(245,166,35,0.1)' : C.surface,
                border: `1px solid ${vote === c.id ? C.accent : C.border}`,
                borderRadius: 6,
                padding: '14px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  border: `1.5px solid ${vote === c.id ? C.accent : C.border}`,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {vote === c.id && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.accent }} />
                )}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontFamily: fonts.display,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    color: C.text,
                  }}
                >
                  {c.nombre}
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                  {c.rol ? roleData[c.rol].label : ''}
                </div>
              </div>
            </button>
          ))}
        </div>

        <Block>
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>🔒 Tu voto es privado.</p>
        </Block>

        {error && (
          <Block>
            <p style={{ fontSize: 13, color: C.danger, margin: 0 }}>{error}</p>
          </Block>
        )}

        <p style={{ fontSize: 12, color: C.dimmed, textAlign: 'center' }}>
          No se muestra el ranking todavía.
        </p>

        <div style={{ marginTop: 'auto' }}>
          <Btn onClick={enviar} disabled={!vote || enviando}>
            {enviando ? 'Enviando...' : 'Enviar voto'}
          </Btn>
        </div>
      </div>
    </Wrap>
  );
}
