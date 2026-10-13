/**
 * How a carousel swipe is read when the finger lifts (pure; runs as a worklet).
 */

/** A drag this far (fraction of a slide, at most SWIPE_COMMIT_DP) changes car. */
export const SWIPE_COMMIT = 0.18;
export const SWIPE_COMMIT_DP = 64;
/** Release speed (cars per second) that counts as a flick. */
export const FLICK_VELOCITY = 0.6;
/** The snap's starting speed is kept within this (cars per second). */
export const MAX_RELEASE_VELOCITY = 8;

export interface SwipeRelease {
  /** Cars to move: -1, 0 (spring back) or 1. */
  dir: number;
  /** Starting speed for the snap (cars per second, towards higher indices when positive). */
  velocity: number;
}

/**
 * A flick, or a drag past the commit distance, moves one car in the direction
 * the finger travelled; anything smaller springs back. Short swipes from small
 * hands count, on tablets too.
 *
 * The reported velocity is trusted only when it agrees with the finger's
 * travel. On the web it comes from a curve fitted through the last few pointer
 * events, and when those arrive unevenly the curve can point backwards (seen in
 * about 1 in 15 rapid swipes in automated tests), which would send the
 * carousel the wrong way. Its size is also capped for the snap.
 */
export function swipeRelease(translationX: number, velocityX: number, slideW: number): SwipeRelease {
  'worklet';
  const travel = -translationX;
  const way = travel > 0 ? 1 : travel < 0 ? -1 : 0;
  const reported = -velocityX / slideW;
  const velocity = way !== 0 && Math.sign(reported) === way ? Math.max(-MAX_RELEASE_VELOCITY, Math.min(MAX_RELEASE_VELOCITY, reported)) : 0;
  const commit = Math.min(SWIPE_COMMIT * slideW, SWIPE_COMMIT_DP);
  const dir = Math.abs(velocity) > FLICK_VELOCITY || Math.abs(travel) > commit ? way : 0;
  return { dir, velocity };
}
