export function TowerFront() {
  const block = (x: number, y: number, w = 1) => (
    <rect
      key={`${x}-${y}`}
      x={x * 14 + 1}
      y={y * 14 + 1}
      width={w * 14 - 2}
      height={12}
      rx={1}
      fill="#f0ece4"
      opacity={0.9}
    />
  );
  return (
    <svg width={160} height={90} viewBox="0 0 160 90" style={{ display: 'block' }}>
      {block(5, 0)}
      {block(3, 1)}
      {block(4, 1)}
      {block(5, 1)}
      {block(6, 1)}
      {block(2, 2)}
      {block(5, 2)}
      {block(1, 3)}
      {block(2, 3)}
      {block(3, 3)}
      {block(4, 3)}
      {block(5, 3)}
      {block(6, 3)}
      {block(7, 3)}
      {block(8, 3)}
    </svg>
  );
}

export function TowerTop() {
  const filled = [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
    [1, 2],
    [2, 2],
  ];
  const empty = [
    [2, 0],
    [0, 2],
    [2, 1],
  ];
  return (
    <svg width={120} height={120} viewBox="0 0 120 120" style={{ display: 'block' }}>
      {filled.map(([c, r]) => (
        <rect
          key={`f${c}${r}`}
          x={c * 38 + 4}
          y={r * 38 + 4}
          width={32}
          height={32}
          rx={2}
          fill="#f0ece4"
          opacity={0.9}
        />
      ))}
      {empty.map(([c, r]) => (
        <rect
          key={`e${c}${r}`}
          x={c * 38 + 4}
          y={r * 38 + 4}
          width={32}
          height={32}
          rx={2}
          fill="none"
          stroke="#555"
          strokeWidth={1.5}
        />
      ))}
    </svg>
  );
}
