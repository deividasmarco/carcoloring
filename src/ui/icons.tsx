/**
 * Custom icon set — one 32-unit grid, 2.4-unit rounded strokes, so every
 * control reads as part of the same physical toolset.
 */
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'garage'
  | 'undo'
  | 'redo'
  | 'crayon'
  | 'pencil'
  | 'eraser'
  | 'lights'
  | 'wash'
  | 'flag'
  | 'save'
  | 'share'
  | 'check'
  | 'close'
  | 'fit'
  | 'prev'
  | 'next'
  | 'lock'
  | 'eye'
  | 'parent'
  | 'back'
  | 'grid'
  | 'gallery'
  | 'plus'
  | 'trash';

interface Props {
  name: IconName;
  size?: number;
  color: string;
  /** Secondary tone for two-tone icons (crayon tip, flag checks). */
  accent?: string;
}

const S = { strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };

export function Icon({ name, size = 28, color, accent }: Props) {
  const a = accent ?? color;
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <G stroke={color} {...S}>
        {render(name, color, a)}
      </G>
    </Svg>
  );
}

function render(name: IconName, c: string, a: string) {
  switch (name) {
    case 'garage':
      return (
        <>
          <Path d="M4 14 L16 6 L28 14" />
          <Path d="M8 27 V15 H24 V27" />
          <Path d="M11 19 H21 M11 23 H21" />
        </>
      );
    case 'undo':
      return (
        <>
          <Path d="M12 7 L5 14 L12 21" />
          <Path d="M5 14 H20 C24.4 14 27.5 17.3 27.5 21.3 C27.5 25.3 24.4 28 20 28 H13" />
        </>
      );
    case 'redo':
      return (
        <>
          <Path d="M20 7 L27 14 L20 21" />
          <Path d="M27 14 H12 C7.6 14 4.5 17.3 4.5 21.3 C4.5 25.3 7.6 28 12 28 H19" />
        </>
      );
    case 'crayon':
      return (
        <>
          {/* Body, wrapper bands and a coloured wax tip. */}
          <Path d="M8.5 27.5 L4.5 23.5 L18.5 9.5 L22.5 13.5 Z" />
          <Path d="M8 20 L12 24 M11.5 16.5 L15.5 20.5" />
          <Path d="M18.5 9.5 L24 4.5 L27.5 8 L22.5 13.5 Z" fill={a} stroke={c} />
        </>
      );
    case 'pencil':
      return (
        <>
          <Path d="M6 26 L5 27 M7.5 21 L21 7.5 L24.5 11 L11 24.5 Z" />
          <Path d="M7.5 21 L5 27 L11 24.5" fill={a} />
          <Path d="M19 9.5 L22.5 13" />
        </>
      );
    case 'eraser':
      return (
        <>
          <Path d="M13 27 L5.5 19.5 L18 7 L25.5 14.5 Z" />
          <Path d="M9.5 15.5 L17 23" />
          <Path d="M13 27 H27" />
        </>
      );
    case 'lights':
      return (
        <>
          <Path d="M14 5 C14.8 10.5 16.5 12.2 22 13 C16.5 13.8 14.8 15.5 14 21 C13.2 15.5 11.5 13.8 6 13 C11.5 12.2 13.2 10.5 14 5 Z" />
          <Path d="M23 19 C23.4 21.6 24.4 22.6 27 23 C24.4 23.4 23.4 24.4 23 27 C22.6 24.4 21.6 23.4 19 23 C21.6 22.6 22.6 21.6 23 19 Z" />
        </>
      );
    case 'wash':
      return (
        <>
          {/* Water drop with bubbles: a car wash. */}
          <Path d="M13 4.5 C13 4.5 5.5 13 5.5 18.5 C5.5 22.9 8.9 26 13 26 C17.1 26 20.5 22.9 20.5 18.5 C20.5 13 13 4.5 13 4.5 Z" />
          <Path d="M9.5 18.5 C9.5 20.6 10.9 22 13 22" />
          <Circle cx={24.5} cy={10} r={2.6} />
          <Circle cx={25.5} cy={20.5} r={1.8} />
        </>
      );
    case 'flag':
      return (
        <>
          <Path d="M7 28 V4.5" />
          <Path d="M7 6 C12 3.5 16 8.5 26 5.5 V18 C16 21 12 16 7 18.5" />
          <G stroke="none" fill={a}>
            <Rect x={11} y={6.4} width={4} height={4} />
            <Rect x={19} y={7.2} width={4} height={4} />
            <Rect x={15} y={10.6} width={4} height={4} />
            <Rect x={11} y={14.6} width={4} height={4} />
            <Rect x={19} y={14.4} width={4} height={3.4} />
          </G>
        </>
      );
    case 'save':
      return (
        <>
          <Path d="M16 4.5 V19" />
          <Path d="M10 13.5 L16 19.5 L22 13.5" />
          <Path d="M5 21 V25.5 C5 26.6 5.9 27.5 7 27.5 H25 C26.1 27.5 27 26.6 27 25.5 V21" />
        </>
      );
    case 'share':
      return (
        <>
          <Path d="M16 4.5 V19.5" />
          <Path d="M10.5 10 L16 4.5 L21.5 10" />
          <Path d="M11 14 H8 C6.9 14 6 14.9 6 16 V25.5 C6 26.6 6.9 27.5 8 27.5 H24 C25.1 27.5 26 26.6 26 25.5 V16 C26 14.9 25.1 14 24 14 H21" />
        </>
      );
    case 'check':
      return <Path d="M6 16.5 L13 23.5 L26.5 9" strokeWidth={3.2} />;
    case 'close':
      return <Path d="M8 8 L24 24 M24 8 L8 24" strokeWidth={3.2} />;
    case 'prev':
      return <Path d="M19.5 6 L9.5 16 L19.5 26" strokeWidth={3.2} />;
    case 'next':
      return <Path d="M12.5 6 L22.5 16 L12.5 26" strokeWidth={3.2} />;
    case 'lock':
      return (
        <>
          <Rect x={7} y={14} width={18} height={13} rx={3} />
          <Path d="M11 14 V10.5 C11 7.5 13.2 5.5 16 5.5 C18.8 5.5 21 7.5 21 10.5 V14" />
          <Path d="M16 19 V22" stroke={a} />
        </>
      );
    case 'eye':
      return (
        <>
          <Path d="M3.5 16 C7 9.5 11.2 7 16 7 C20.8 7 25 9.5 28.5 16 C25 22.5 20.8 25 16 25 C11.2 25 7 22.5 3.5 16 Z" />
          <Circle cx={16} cy={16} r={4.2} stroke={a} />
        </>
      );
    case 'parent':
      return (
        <>
          <Circle cx={12} cy={10} r={4} />
          <Path d="M4.5 27 C4.5 21.5 7.8 18 12 18 C16.2 18 19.5 21.5 19.5 27" />
          <Circle cx={23} cy={14.5} r={2.8} stroke={a} />
          <Path d="M18.5 27 C18.5 23 20.4 21 23 21 C25.6 21 27.5 23 27.5 27" stroke={a} />
        </>
      );
    case 'back':
      return <Path d="M14 7 L5 16 L14 25 M5.5 16 H27" strokeWidth={3} />;
    case 'grid':
      return (
        <>
          <Rect x={5} y={5} width={9} height={9} rx={2} />
          <Rect x={18} y={5} width={9} height={9} rx={2} />
          <Rect x={5} y={18} width={9} height={9} rx={2} />
          <Rect x={18} y={18} width={9} height={9} rx={2} />
        </>
      );
    case 'gallery':
      return (
        <>
          <Rect x={4} y={7} width={24} height={18} rx={3} />
          <Path d="M4 21 L11 15 L17 20 L21 17 L28 22" />
          <Circle cx={21} cy={12} r={2} stroke={a} />
        </>
      );
    case 'plus':
      return <Path d="M16 7 V25 M7 16 H25" />;
    case 'trash':
      return (
        <>
          <Path d="M6 9 H26 M13 9 V6.5 C13 5.7 13.7 5 14.5 5 H17.5 C18.3 5 19 5.7 19 6.5 V9" />
          <Path d="M8.5 9 L10 25.5 C10.1 26.3 10.8 27 11.6 27 H20.4 C21.2 27 21.9 26.3 22 25.5 L23.5 9" />
          <Path d="M14 14 V22 M18 14 V22" />
        </>
      );
    case 'fit':
      return (
        <>
          <Path d="M5 11 V6.5 C5 5.7 5.7 5 6.5 5 H11 M21 5 H25.5 C26.3 5 27 5.7 27 6.5 V11" />
          <Path d="M27 21 V25.5 C27 26.3 26.3 27 25.5 27 H21 M11 27 H6.5 C5.7 27 5 26.3 5 25.5 V21" />
          <Rect x={11} y={13} width={10} height={6} rx={2} />
        </>
      );
  }
}
