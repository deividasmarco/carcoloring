/**
 * A wax crayon drawn to scale: bare wax tip, paper wrapper with printed
 * bands. Pointing "up" (bottom tray) or "left" (side rail, toward the car).
 */
import Svg, { Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

interface Props {
  color: string;
  /** Length along the crayon (dp). */
  length: number;
  /** Thickness (dp); defaults to a natural crayon proportion. */
  thickness?: number;
  direction: 'up' | 'left';
  id: string;
}

export function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + (amount < 0 ? c * amount : (255 - c) * amount))));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function Crayon({ color, length, thickness, direction, id }: Props) {
  const thick = Math.round(thickness ?? length * 0.26);
  const up = direction === 'up';
  const dark = shade(color, -0.4);
  const light = shade(color, 0.4);
  const grad = `wax-${id}`;
  return (
    <Svg width={up ? thick : length} height={up ? length : thick} viewBox={up ? '0 0 26 100' : '0 0 100 26'} preserveAspectRatio="none">
      <Defs>
        <LinearGradient id={grad} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={dark} />
          <Stop offset="0.32" stopColor={light} />
          <Stop offset="0.58" stopColor={color} />
          <Stop offset="1" stopColor={dark} />
        </LinearGradient>
      </Defs>
      {/* Authored pointing up in a 26×100 box. */}
      <G transform={up ? undefined : 'translate(0 26) rotate(-90)'}>
        <Path d="M5 27 L11 7 Q13 2 15 7 L21 27 Z" fill={`url(#${grad})`} />
        <Rect x={3} y={26} width={20} height={74} rx={3} fill={`url(#${grad})`} />
        <Rect x={3} y={38} width={20} height={58} fill={dark} opacity={0.5} />
        <Rect x={3} y={44} width={20} height={3} fill="#000" opacity={0.32} />
        <Rect x={3} y={86} width={20} height={3} fill="#000" opacity={0.32} />
        <Rect x={6} y={28} width={3.5} height={66} rx={1.75} fill="#fff" opacity={0.3} />
      </G>
    </Svg>
  );
}
