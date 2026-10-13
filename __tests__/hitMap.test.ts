import {
  CELL_DECOR,
  CELL_EMPTY,
  CELL_LINE,
  decodeRle,
  encodeRle,
  fromBase64,
  resolveStartRegion,
  toBase64,
  type HitMapData,
} from '../src/engine/regions/hitMap';

/**
 * Synthetic 40×20 map:  [ region 1 | outline | region 2 ]  with a decor block
 * and an outline band along the outer edge of region 2.
 *
 *   x 0..18   → 1
 *   x 19..21  → LINE (3 cells, the seam)
 *   x 22..35  → 2
 *   x 36..39  → LINE (outer silhouette band), then empty beyond the map
 *   (5..8, 2..5) → DECOR
 */
function syntheticMap(): HitMapData {
  const width = 40;
  const height = 20;
  const cells = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let v = 0;
      if (x <= 18) v = 1;
      else if (x <= 21) v = CELL_LINE;
      else if (x <= 35) v = 2;
      else v = CELL_LINE;
      if (x >= 5 && x <= 8 && y >= 2 && y <= 5) v = CELL_DECOR;
      cells[y * width + x] = v;
    }
  }
  return { x: 100, y: 200, width, height, cells };
}

const opts = { searchRadius: 6, ambiguityMargin: 1 };

describe('hit map codec', () => {
  it('round-trips RLE and base64', () => {
    const cells = new Uint8Array(5000);
    for (let i = 0; i < cells.length; i++) cells[i] = i % 977 < 400 ? 3 : i % 7 === 0 ? 255 : 0;
    const rle = encodeRle(cells);
    expect(rle.length).toBeLessThan(cells.length);
    const decoded = decodeRle(fromBase64(toBase64(rle)), cells.length);
    expect(Array.from(decoded)).toEqual(Array.from(cells));
  });

  it('rejects a corrupt or truncated stream', () => {
    const rle = encodeRle(new Uint8Array(300).fill(4));
    expect(() => decodeRle(rle, 299)).toThrow();
    expect(() => decodeRle(rle, 301)).toThrow();
  });

  it('handles base64 padding lengths', () => {
    for (const n of [1, 2, 3, 4, 5]) {
      const b = Uint8Array.from({ length: n }, (_, i) => (i * 97) & 255);
      expect(Array.from(fromBase64(toBase64(b)))).toEqual(Array.from(b));
    }
  });
});

describe('resolveStartRegion', () => {
  const map = syntheticMap();

  it('locks to the region under the touch', () => {
    expect(resolveStartRegion(map, 110.5, 210.5, opts)).toEqual({ code: 1, reason: 'inside' });
    expect(resolveStartRegion(map, 130.5, 210.5, opts)).toEqual({ code: 2, reason: 'inside' });
  });

  it('does not paint when starting outside the vehicle', () => {
    expect(resolveStartRegion(map, 150, 210, opts).code).toBeNull();
    expect(resolveStartRegion(map, 50, 50, opts).code).toBeNull();
  });

  it('does not paint when starting on a non-colourable part', () => {
    expect(resolveStartRegion(map, 106.5, 203.5, opts)).toEqual({ code: null, reason: 'decor' });
  });

  it('refuses a touch exactly on the seam between two regions', () => {
    // Middle of the 3-cell band: equidistant from both sides.
    expect(resolveStartRegion(map, 120.5, 210.5, opts)).toEqual({ code: null, reason: 'ambiguous' });
  });

  it('picks the clearly nearer region when the touch is off-centre on a seam', () => {
    expect(resolveStartRegion(map, 119.2, 210.5, opts)).toEqual({ code: 1, reason: 'near-outline' });
    expect(resolveStartRegion(map, 121.8, 210.5, opts)).toEqual({ code: 2, reason: 'near-outline' });
  });

  it('selects the only nearby region when starting on the outer outline', () => {
    expect(resolveStartRegion(map, 137.5, 210.5, opts)).toEqual({ code: 2, reason: 'near-outline' });
  });

  it('never chooses a region beyond the search radius', () => {
    // Outer band is 4 cells wide; with a tiny radius nothing is in reach from its far edge.
    expect(resolveStartRegion(map, 139.5, 210.5, { searchRadius: 2, ambiguityMargin: 1 }).code).toBeNull();
  });
});
