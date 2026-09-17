import { C, fonts } from '../../theme';
import { Label } from './Label';

export function RoundHeader({
  round,
  time,
  progress,
}: {
  round: string;
  time?: string;
  progress?: number;
}) {
  return (
    <div style={{ paddingTop: 16, paddingBottom: 8 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <Label>{round}</Label>
        {time && (
          <span style={{ fontFamily: fonts.mono, fontSize: 13, color: C.accent }}>⏱ {time}</span>
        )}
      </div>
      {progress !== undefined && (
        <div style={{ height: 3, background: C.border, borderRadius: 2 }}>
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: C.accent,
              borderRadius: 2,
              transition: 'width 0.5s',
            }}
          />
        </div>
      )}
    </div>
  );
}
