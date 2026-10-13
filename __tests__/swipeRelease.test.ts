import { FLICK_VELOCITY, MAX_RELEASE_VELOCITY, swipeRelease, SWIPE_COMMIT_DP } from '../src/features/garage/swipeRelease';

const W = 900; // slide width (dp)

describe('carousel swipe release', () => {
  it('a drag past the commit distance moves one car the way the finger went', () => {
    expect(swipeRelease(-(SWIPE_COMMIT_DP + 1), 0, W).dir).toBe(1);
    expect(swipeRelease(SWIPE_COMMIT_DP + 1, 0, W).dir).toBe(-1);
  });

  it('a short slow drag springs back', () => {
    expect(swipeRelease(-30, -10, W).dir).toBe(0);
  });

  it('a short quick flick moves one car', () => {
    const r = swipeRelease(-30, -(FLICK_VELOCITY + 0.5) * W, W);
    expect(r.dir).toBe(1);
    expect(r.velocity).toBeCloseTo(FLICK_VELOCITY + 0.5);
  });

  it('ignores a velocity pointing against the finger (a misread estimate)', () => {
    // Finger travelled 200 dp towards the next car, velocity reported backwards
    // (as recorded in a browser test): still the next car, and no backwards kick.
    expect(swipeRelease(-200, 2.26 * W, W)).toEqual({ dir: 1, velocity: 0 });
    // A short drag with a backwards velocity springs back instead of moving the wrong way.
    expect(swipeRelease(-20, 5 * W, W)).toEqual({ dir: 0, velocity: 0 });
  });

  it('keeps the snap speed in a sane range', () => {
    expect(swipeRelease(-300, -1000 * W, W).velocity).toBe(MAX_RELEASE_VELOCITY);
    expect(swipeRelease(300, 1000 * W, W).velocity).toBe(-MAX_RELEASE_VELOCITY);
  });

  it('no travel, no move', () => {
    expect(swipeRelease(0, -3 * W, W)).toEqual({ dir: 0, velocity: 0 });
  });
});
