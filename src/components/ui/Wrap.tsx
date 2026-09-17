import type { ReactNode } from 'react';
import { C, fonts } from '../../theme';

export function Wrap({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        maxWidth: 420,
        margin: '0 auto',
        background: C.bg,
        display: 'flex',
        flexDirection: 'column',
        padding: '0 20px',
        fontFamily: fonts.mono,
      }}
    >
      {children}
    </div>
  );
}
