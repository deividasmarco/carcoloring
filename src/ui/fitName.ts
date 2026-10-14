/**
 * Sizes a vehicle name (Michroma, upper case) to show in full: the largest
 * size that fits on one line, then two balanced lines, never truncated.
 * Widths come from the font's own metrics (fontMetrics.generated.ts), so the
 * result is the same on every platform.
 */
import { MICHROMA_ADVANCE, MICHROMA_WIDEST } from './fontMetrics.generated';

export interface NameFit {
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  lines: string[];
}

export interface NameFitOptions {
  /** Largest size (dp). */
  max?: number;
  /** Smallest size for one line before trying two. */
  minOneLine?: number;
  /** Smallest size for two lines. */
  minTwoLines?: number;
  /** Absolute floor for a single word too long for the room. */
  floor?: number;
}

/** Rendering differs slightly between platforms (kerning, hinting): keep a margin. */
const SAFETY = 1.04;

/** Letter spacing tightens as the size drops, so small names stay legible. */
export const nameSpacing = (size: number) => Math.round(size * (size >= 22 ? 0.1 : 0.06) * 10) / 10;

/** Width (dp) of `text` in Michroma, upper case, with `spacing` after every character. */
export function michromaWidth(text: string, size: number, spacing = nameSpacing(size)) {
  let em = 0;
  for (const ch of text.toUpperCase()) em += MICHROMA_ADVANCE[ch] ?? MICHROMA_WIDEST;
  return (em * size + spacing * text.length) * SAFETY;
}

/** The two-line split whose longer line is shortest. */
function balancedSplit(name: string, size: number): string[] | null {
  const words = name.split(' ');
  if (words.length < 2) return null;
  let best: string[] | null = null;
  let bestWidth = Infinity;
  for (let i = 1; i < words.length; i++) {
    const lines = [words.slice(0, i).join(' '), words.slice(i).join(' ')];
    const w = Math.max(...lines.map((l) => michromaWidth(l, size)));
    if (w < bestWidth) {
      bestWidth = w;
      best = lines;
    }
  }
  return best;
}

export function fitVehicleName(name: string, width: number, opts: NameFitOptions = {}): NameFit {
  const { max = 30, minOneLine = 20, minTwoLines = 16, floor = 13 } = opts;
  const text = name.toUpperCase();
  const fit = (fontSize: number, lines: string[]): NameFit => ({
    fontSize,
    letterSpacing: nameSpacing(fontSize),
    lineHeight: Math.round(fontSize * 1.3),
    lines,
  });
  for (let s = max; s >= minOneLine; s--) if (michromaWidth(text, s) <= width) return fit(s, [text]);
  // Two lines are never larger than the smallest single line, so neighbours look alike.
  for (let s = Math.min(max, minOneLine); s >= minTwoLines; s--) {
    const lines = balancedSplit(text, s);
    if (lines && lines.every((l) => michromaWidth(l, s) <= width)) return fit(s, lines);
  }
  // Still too long (a very long single word in a narrow space): the size that fits, within the floor.
  const lines = balancedSplit(text, minTwoLines) ?? [text];
  let s = minTwoLines;
  while (s > floor && lines.some((l) => michromaWidth(l, s) > width)) s--;
  return fit(s, lines);
}

/**
 * One size for a set of names (a grid of cards), so they look alike: the
 * largest size at which every name fits in at most two lines. Each name gets
 * one line when it fits, otherwise two balanced lines.
 */
export function fitNamesUniformly(names: string[], width: number, { max = 15, min = 10 } = {}): (name: string) => NameFit {
  const linesAt = (name: string, size: number): string[] | null => {
    const text = name.toUpperCase();
    if (michromaWidth(text, size) <= width) return [text];
    const two = balancedSplit(text, size);
    return two && two.every((l) => michromaWidth(l, size) <= width) ? two : null;
  };
  let size = max;
  while (size > min && names.some((n) => !linesAt(n, size))) size--;
  return (name) => ({
    fontSize: size,
    letterSpacing: nameSpacing(size),
    lineHeight: Math.round(size * 1.3),
    lines: linesAt(name, size) ?? balancedSplit(name.toUpperCase(), size) ?? [name.toUpperCase()],
  });
}

/** Largest size (within [min, max]) at which a one-line Michroma title fits. */
export function fitTitleSize(title: string, width: number, max = 18, min = 12) {
  let s = max;
  while (s > min && michromaWidth(title, s) > width) s--;
  return s;
}
