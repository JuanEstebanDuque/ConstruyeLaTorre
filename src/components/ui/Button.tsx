import type { CSSProperties, ReactNode } from 'react';
import { C, fonts } from '../../theme';

export function Btn({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
}) {
  const styles: Record<string, CSSProperties> = {
    primary: { background: C.text, color: '#111', border: 'none' },
    ghost: { background: 'transparent', color: C.text, border: `1px solid ${C.border}` },
    danger: { background: 'transparent', color: C.danger, border: `1px solid ${C.danger}` },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '15px 20px',
        fontFamily: fonts.display,
        fontWeight: 800,
        fontSize: 18,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        borderRadius: 4,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.38 : 1,
        transition: 'opacity 0.15s',
        ...styles[variant],
      }}
    >
      {children}
    </button>
  );
}
