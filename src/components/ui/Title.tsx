import type { ReactNode } from 'react';
import { C, fonts } from '../../theme';

export function Title({ children, sub }: { children: ReactNode; sub?: boolean }) {
  return (
    <h2
      style={{
        fontFamily: fonts.display,
        fontWeight: 900,
        fontSize: sub ? 28 : 42,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: C.text,
        margin: 0,
        lineHeight: 1,
      }}
    >
      {children}
    </h2>
  );
}
