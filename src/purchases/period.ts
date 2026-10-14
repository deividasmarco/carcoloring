/** "per month" for a store billing period (ISO 8601 duration such as "P1M"). */
export function perPeriod(period: string | null | undefined): string {
  const m = /^P(\d+)([DWMY])$/.exec(period ?? '');
  if (!m) return 'per month'; // the only product the app sells is monthly
  const n = Number(m[1]);
  const unit = { D: 'day', W: 'week', M: 'month', Y: 'year' }[m[2] as 'D' | 'W' | 'M' | 'Y'];
  return n === 1 ? `per ${unit}` : `every ${n} ${unit}s`;
}
