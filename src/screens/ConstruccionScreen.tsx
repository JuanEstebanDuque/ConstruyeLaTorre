import { useEffect, useState } from 'react';
import type { EventoContenido, PlanoContenido, Screen } from '../types/game';
import { useGame } from '../context/GameContext';
import { getMiEvento, getMiPlano, actualizarFase, subscribeRonda } from '../api/rondas';
import { Wrap } from '../components/ui/Wrap';
import { Btn } from '../components/ui/Button';
import { RoundHeader } from '../components/ui/RoundHeader';
import { EventModal } from '../components/EventModal';
import { PlanoContent } from '../components/PlanoContent';

export function ConstruccionScreen({ go }: { go: (s: Screen) => void }) {
  const { rondaId, jugadorId, miRol, rondaNumero } = useGame();
  const [time, setTime] = useState(222);
  const [plano, setPlano] = useState<PlanoContenido | null>(null);
  const [evento, setEvento] = useState<EventoContenido | null>(null);
  const [showEvent, setShowEvent] = useState(false);
  const [validando, setValidando] = useState(false);

  useEffect(() => {
    if (time <= 0) return;
    const t = setTimeout(() => setTime((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [time]);

  useEffect(() => {
    if (!rondaId || !jugadorId) return;
    if (miRol !== 'constructor') {
      getMiPlano(rondaId, jugadorId)
        .then(setPlano)
        .catch(() => {});
    }
    getMiEvento(rondaId, jugadorId)
      .then((ev) => {
        if (ev) {
          setEvento(ev);
          setShowEvent(true);
        }
      })
      .catch(() => {});
  }, [rondaId, jugadorId, miRol]);

  // Punto de sincronía: cuando el Constructor inicia Validación, los demás
  // roles navegan automáticamente en cuanto la ronda cambia de fase.
  useEffect(() => {
    if (!rondaId || miRol === 'constructor') return;
    const unsubscribe = subscribeRonda(rondaId, (ronda) => {
      if (ronda.fase === 'validacion') {
        go('validacion');
      }
    });
    return unsubscribe;
  }, [rondaId, miRol, go]);

  const mm = String(Math.floor(time / 60)).padStart(2, '0');
  const ss = String(time % 60).padStart(2, '0');
  const progress = ((222 - time) / 222) * 100;

  const validar = async () => {
    if (!rondaId) return;
    setValidando(true);
    try {
      await actualizarFase(rondaId, 'validacion');
      go('validacion');
    } catch {
      setValidando(false);
    }
  };

  if (!miRol) return null;

  return (
    <Wrap>
      {showEvent && evento && (
        <EventModal tipo={evento.tipo} duracionSeg={evento.duracion_seg} onClose={() => setShowEvent(false)} />
      )}
      <div
        style={{
          paddingTop: 16,
          paddingBottom: 24,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <RoundHeader round={`Ronda ${rondaNumero} de 3`} time={`${mm}:${ss}`} progress={progress} />

        <PlanoContent role={miRol} plano={plano} />

        {miRol === 'constructor' && (
          <div style={{ marginTop: 'auto' }}>
            <Btn onClick={validar} disabled={validando}>
              {validando ? 'Iniciando validación...' : 'Validar construcción'}
            </Btn>
          </div>
        )}
      </div>
    </Wrap>
  );
}
