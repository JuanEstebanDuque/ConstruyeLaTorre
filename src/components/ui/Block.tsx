import type { ReactNode } from 'react';
import { C } from '../../theme';
import { Label } from './Label';

export function Block({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div
      style={{
        background: C.surface,
        borderRadius: 6,
        padding: '14px 16px',
        border: `1px solid ${C.border}`,
      }}
    >
      {label && <Label>{label}</Label>}
      {label && <div style={{ height: 10 }} />}
      {children}
    </div>
  );
}
