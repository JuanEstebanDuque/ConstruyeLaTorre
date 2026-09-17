import { C, fonts } from '../../theme';

export function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: C.muted,
        padding: 0,
        fontSize: 13,
        fontFamily: fonts.mono,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      ← volver
    </button>
  );
}
