import type { ReactNode } from 'react';
import { C } from '../../theme';

export function Label({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return (
    <p
      style={{
        fontSize: 11,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: accent ? C.accent : C.muted,
        margin: 0,
      }}
    >
      {children}
    </p>
  );
}
