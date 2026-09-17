import { C, fonts } from '../theme';
import type { EventoTipo } from '../types/game';
import { EVENTO_INFO } from '../data/eventoData';
import { Label } from './ui/Label';
import { Btn } from './ui/Button';

export function EventModal({
  tipo,
  duracionSeg,
  onClose,
}: {
  tipo: EventoTipo;
  duracionSeg: number;
  onClose: () => void;
}) {
  const info = EVENTO_INFO[tipo];
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.danger}`,
          borderRadius: 8,
          padding: '28px 24px',
          width: '100%',
          maxWidth: 380,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Label>⚡ Evento</Label>
          <div style={{ height: 8 }} />
          <h2
            style={{
              fontFamily: fonts.display,
              fontWeight: 900,
              fontSize: 32,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: C.danger,
              margin: 0,
            }}
          >
            {info.titulo}
          </h2>
        </div>
        <div style={{ textAlign: 'center', fontSize: 40 }}>{info.icono}</div>
        <p style={{ fontSize: 14, color: '#c0b8b0', lineHeight: 1.6, textAlign: 'center', margin: 0 }}>
          {info.descripcion}
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '10px 0',
            borderTop: `1px solid ${C.border}`,
          }}
        >
          <Label>Duración</Label>
          <span style={{ fontFamily: fonts.mono, fontSize: 14, color: C.accent }}>
            00:{String(duracionSeg).padStart(2, '0')}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Btn onClick={onClose}>Entendido</Btn>
        </div>
      </div>
    </div>
  );
}
