/**
 * Marching-squares iso-contours of a scalar grid (values at pixel centres),
 * linked into closed, consistently oriented loops, plus Ramer–Douglas–Peucker
 * simplification and SVG output. Used to vectorise line art and region masks.
 */

export type Loop = number[]; // flat [x0, y0, x1, y1, …], closed implicitly

/**
 * Closed contours of `value(x, y) >= iso` restricted to the pixel window
 * [x0, x1) × [y0, y1). Values outside the window count as 0, so loops close.
 */
export function isoContours(
  value: (x: number, y: number) => number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  iso = 0.5,
): Loop[] {
  const W = x1 - x0 + 2; // padded grid: indices -1 .. (x1 - x0)
  const H = y1 - y0 + 2;
  const grid = new Float32Array(W * H);
  for (let gy = 0; gy < H; gy++) {
    const y = y0 + gy - 1;
    if (y < y0 || y >= y1) continue;
    for (let gx = 0; gx < W; gx++) {
      const x = x0 + gx - 1;
      if (x < x0 || x >= x1) continue;
      grid[gy * W + gx] = value(x, y);
    }
  }
  const at = (gx: number, gy: number) => grid[gy * W + gx];
  // Edge keys: horizontal edge from (gx,gy)→(gx+1,gy) = 2·(gy·W+gx); vertical (gx,gy)→(gx,gy+1) = +1.
  const hKey = (gx: number, gy: number) => (gy * W + gx) * 2;
  const vKey = (gx: number, gy: number) => (gy * W + gx) * 2 + 1;
  const next = new Map<number, number>();
  const point = new Map<number, [number, number]>();

  const cross = (key: number, ax: number, ay: number, bx: number, by: number) => {
    if (!point.has(key)) {
      const va = at(ax, ay);
      const vb = at(bx, by);
      const t = va === vb ? 0.5 : (iso - va) / (vb - va);
      const px = ax + (bx - ax) * t;
      const py = ay + (by - ay) * t;
      // Grid index → pixel-centre coordinates.
      point.set(key, [x0 + px - 1 + 0.5, y0 + py - 1 + 0.5]);
    }
    return key;
  };

  for (let gy = 0; gy < H - 1; gy++) {
    for (let gx = 0; gx < W - 1; gx++) {
      const v0 = at(gx, gy) >= iso; // top-left
      const v1 = at(gx + 1, gy) >= iso; // top-right
      const v2 = at(gx + 1, gy + 1) >= iso; // bottom-right
      const v3 = at(gx, gy + 1) >= iso; // bottom-left
      if (v0 === v1 && v1 === v2 && v2 === v3) continue;
      // Clockwise edges: T (v0→v1), R (v1→v2), B (v2→v3), L (v3→v0).
      const edges: { key: number; enter: boolean }[] = [];
      const consider = (a: boolean, b: boolean, key: () => number) => {
        if (a !== b) edges.push({ key: key(), enter: !a && b });
      };
      consider(v0, v1, () => cross(hKey(gx, gy), gx, gy, gx + 1, gy));
      consider(v1, v2, () => cross(vKey(gx + 1, gy), gx + 1, gy, gx + 1, gy + 1));
      consider(v2, v3, () => cross(hKey(gx, gy + 1), gx + 1, gy + 1, gx, gy + 1));
      consider(v3, v0, () => cross(vKey(gx, gy), gx, gy + 1, gx, gy));
      if (edges.length === 2) {
        const [a, b] = edges;
        if (a.enter) next.set(a.key, b.key);
        else next.set(b.key, a.key);
      } else if (edges.length === 4) {
        // Saddle: decide connectivity from the cell centre.
        const centre = (at(gx, gy) + at(gx + 1, gy) + at(gx + 1, gy + 1) + at(gx, gy + 1)) / 4 >= iso;
        const [e0, e1, e2, e3] = edges; // clockwise order, alternating enter/leave
        const E = [e0, e1, e2, e3].filter((e) => e.enter);
        const L = [e0, e1, e2, e3].filter((e) => !e.enter);
        const idx = (e: { key: number }) => edges.indexOf(e as never);
        // Clockwise-next leave edge after each enter edge (disconnected inside),
        // or clockwise-previous (connected inside).
        for (const en of E) {
          const i = idx(en);
          const after = edges[(i + 1) % 4];
          const before = edges[(i + 3) % 4];
          const lv = centre ? before : after;
          if (!L.includes(lv)) throw new Error('marching squares: inconsistent saddle');
          next.set(en.key, lv.key);
        }
      }
    }
  }

  const loops: Loop[] = [];
  const seen = new Set<number>();
  for (const start of next.keys()) {
    if (seen.has(start)) continue;
    const loop: number[] = [];
    let k: number | undefined = start;
    while (k !== undefined && !seen.has(k)) {
      seen.add(k);
      const p = point.get(k)!;
      loop.push(p[0], p[1]);
      k = next.get(k);
    }
    if (loop.length >= 6) loops.push(loop);
  }
  return loops;
}

/** Ramer–Douglas–Peucker on a closed loop. */
export function simplifyLoop(loop: Loop, tolerance: number): Loop {
  const n = loop.length / 2;
  if (n <= 4) return loop;
  // Split the loop at its two most distant vertices (0 and the farthest from it).
  let far = 0;
  let farD = -1;
  for (let i = 1; i < n; i++) {
    const d = (loop[i * 2] - loop[0]) ** 2 + (loop[i * 2 + 1] - loop[1]) ** 2;
    if (d > farD) {
      farD = d;
      far = i;
    }
  }
  const keep = new Uint8Array(n);
  keep[0] = 1;
  keep[far] = 1;
  const rdp = (a: number, b: number) => {
    // Indices along the loop from a to b (b may wrap past n).
    const ax = loop[(a % n) * 2];
    const ay = loop[(a % n) * 2 + 1];
    const bx = loop[(b % n) * 2];
    const by = loop[(b % n) * 2 + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1e-9;
    let worst = -1;
    let worstD = 0;
    for (let i = a + 1; i < b; i++) {
      const px = loop[(i % n) * 2];
      const py = loop[(i % n) * 2 + 1];
      const d = Math.abs((px - ax) * dy - (py - ay) * dx) / len;
      if (d > worstD) {
        worstD = d;
        worst = i;
      }
    }
    if (worst >= 0 && worstD > tolerance) {
      keep[worst % n] = 1;
      rdp(a, worst);
      rdp(worst, b);
    }
  };
  rdp(0, far);
  rdp(far, n);
  const out: number[] = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(loop[i * 2], loop[i * 2 + 1]);
  return out;
}

export function loopsToSvg(loops: Loop[], dx = 0, dy = 0): string {
  const f = (v: number) => {
    const r = Math.round(v * 10) / 10;
    return Object.is(r, -0) ? '0' : String(r);
  };
  return loops
    .map((l) => {
      let d = `M${f(l[0] + dx)} ${f(l[1] + dy)}`;
      for (let i = 2; i < l.length; i += 2) d += `L${f(l[i] + dx)} ${f(l[i + 1] + dy)}`;
      return `${d}Z`;
    })
    .join('');
}

export function loopsVertexCount(loops: Loop[]) {
  return loops.reduce((s, l) => s + l.length / 2, 0);
}
