import type { ReactNode } from 'react';
import { C } from '../../theme';

export function Rule({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 6 }}>
      <span style={{ color: ok ? C.success : C.danger, fontSize: 14, flexShrink: 0 }}>
        {ok ? '✓' : '×'}
      </span>
      <span style={{ fontSize: 13, color: '#c0bab0', lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}
