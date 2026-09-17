import { C } from '../theme';
import type { PlanoContenido, Role } from '../types/game';
import { Block } from './ui/Block';
import { Divider } from './ui/Divider';
import { PieceBadge } from './ui/PieceBadge';
import { TowerFront, TowerTop } from './ui/TowerArt';

// Contenido específico por rol, ya filtrado por el backend (entregas_privadas).
// Se usa tanto en Revelación como en Construcción para mostrar la misma
// información real sin duplicar la lógica de lectura por rol.
export function PlanoContent({ role, plano }: { role: Role; plano: PlanoContenido | null }) {
  if (role === 'constructor') {
    return (
      <Block label="Tu instrucción">
        <p style={{ fontSize: 14, color: '#c0b8b0', lineHeight: 1.7, margin: 0 }}>
          Eres el único jugador que puede manipular las piezas físicas.
          <br />
          <br />
          Sigue las indicaciones de tus compañeros para construir la torre.
        </p>
      </Block>
    );
  }

  if (!plano) {
    return (
      <Block>
        <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Cargando tu información...</p>
      </Block>
    );
  }

  if (role === 'arquitecto' && 'niveles' in plano) {
    return (
      <Block label="Vista frontal">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
          <TowerFront />
        </div>
        <Divider />
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {plano.niveles.map((n) => (
            <div key={n.nivel} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: C.muted }}>Nivel {n.nivel}</span>
              <span style={{ fontSize: 13, color: C.text }}>{n.pieza}</span>
            </div>
          ))}
        </div>
      </Block>
    );
  }

  if (role === 'estructura' && 'relaciones' in plano) {
    return (
      <Block label="Vista superior">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
          <TowerTop />
        </div>
        <Divider />
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {plano.relaciones.map((r, i) => (
            <div key={`${r.pieza}-${i}`} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: C.muted }}>{r.pieza}</span>
              <span style={{ fontSize: 13, color: C.text }}>{r.orientacion}</span>
            </div>
          ))}
        </div>
      </Block>
    );
  }

  if (role === 'materiales' && 'piezas' in plano) {
    return (
      <Block label="Piezas necesarias">
        {Object.entries(plano.piezas).map(([codigo, cantidad]) => (
          <div
            key={codigo}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <PieceBadge code={codigo} />
            <span style={{ fontSize: 14, color: C.text }}>×{cantidad}</span>
          </div>
        ))}
      </Block>
    );
  }

  return null;
}
