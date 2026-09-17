import { fonts } from '../../theme';

export function PieceBadge({ code }: { code: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        background: '#2d1f3a',
        border: '1px solid #6b3fa0',
        borderRadius: 3,
        fontFamily: fonts.mono,
        fontSize: 12,
        color: '#d4a8ff',
        letterSpacing: '0.05em',
      }}
    >
      [{code}]
    </span>
  );
}
