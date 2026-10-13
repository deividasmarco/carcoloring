import { isCorrect, makeChallenge } from '../src/features/parents/gateChallenge';
import { resolveApiKey } from '../src/purchases/apiKey';
import {
  closeParentGate,
  GATE_COOLDOWN_MS,
  GATE_MAX_ATTEMPTS,
  gatePauseRemaining,
  isParentGateOpen,
  openParentGate,
  PARENT_GATE_OPEN_MS,
  recordGateMiss,
} from '../src/state/parentGate';

describe('parental gate question', () => {
  it('is written only in words and needs a typed two-digit answer', () => {
    let seed = 1;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 200; i++) {
      const c = makeChallenge(random);
      expect(c.prompt).toMatch(/^What is [a-z]+ times [a-z]+\?$/);
      expect(c.prompt).not.toMatch(/\d/);
      expect(c.answer).toBeGreaterThanOrEqual(16);
      expect(c.answer).toBeLessThanOrEqual(81);
      expect(isCorrect(c, String(c.answer))).toBe(true);
      expect(isCorrect(c, String(c.answer + 1))).toBe(false);
      expect(isCorrect(c, '')).toBe(false);
    }
  });

  it('asks a different question after a wrong answer', () => {
    const first = makeChallenge(() => 0.5);
    let n = 0;
    const next = makeChallenge(() => [0.5, 0.5, 0.1, 0.9][n++ % 4], first);
    expect(next.prompt).not.toBe(first.prompt);
  });
});

describe('parental gate state', () => {
  afterEach(() => closeParentGate());

  it('opens only after answering, closes on leaving, and times out', () => {
    expect(isParentGateOpen()).toBe(false);
    const t = 1_000_000;
    openParentGate(t);
    expect(isParentGateOpen(t + 1000)).toBe(true);
    expect(isParentGateOpen(t + PARENT_GATE_OPEN_MS + 1)).toBe(false);
    closeParentGate();
    expect(isParentGateOpen(t + 1000)).toBe(false);
  });

  it('pauses after repeated wrong answers, however often the gate is reopened', () => {
    const t = 2_000_000;
    for (let i = 1; i < GATE_MAX_ATTEMPTS; i++) expect(recordGateMiss(t)).toBe(0);
    // Leaving and coming back keeps the count: the next miss starts the pause.
    closeParentGate();
    expect(recordGateMiss(t)).toBe(GATE_COOLDOWN_MS);
    expect(gatePauseRemaining(t + 1000)).toBe(GATE_COOLDOWN_MS - 1000);
    expect(gatePauseRemaining(t + GATE_COOLDOWN_MS)).toBe(0);
    // A correct answer clears the count.
    expect(recordGateMiss(t + GATE_COOLDOWN_MS)).toBe(0);
    openParentGate(t + GATE_COOLDOWN_MS);
    for (let i = 1; i < GATE_MAX_ATTEMPTS; i++) expect(recordGateMiss(t + GATE_COOLDOWN_MS)).toBe(0);
  });
});

describe('RevenueCat API keys', () => {
  it('accepts only public SDK keys for the platform, never secret keys', () => {
    expect(resolveApiKey('ios', 'appl_abc', '')).toEqual({ key: 'appl_abc' });
    expect(resolveApiKey('android', '', 'goog_abc')).toEqual({ key: 'goog_abc' });
    expect(resolveApiKey('ios', '', 'goog_abc')).toHaveProperty('problem');
    expect(resolveApiKey('ios', 'sk_secret', '')).toHaveProperty('problem');
    expect(resolveApiKey('android', '', 'appl_wrong')).toHaveProperty('problem');
  });
});
