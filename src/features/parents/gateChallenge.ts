/**
 * The parental gate's question (pure): a multiplication of two numbers from
 * four to nine, written only in words ("What is seven times eight?"), whose
 * two-digit answer is typed on a keypad. Pre-readers can't read it, young
 * children can't work it out, and guessing has about a 1 in 100 chance. After
 * three wrong answers in a row the gate pauses briefly before asking again
 * (counted in state/parentGate).
 */

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

export interface GateChallenge {
  prompt: string;
  answer: number;
}

export function makeChallenge(random: () => number = Math.random, avoid?: GateChallenge): GateChallenge {
  for (;;) {
    const a = 4 + Math.floor(random() * 6);
    const b = 4 + Math.floor(random() * 6);
    const c = { prompt: `What is ${WORDS[a]} times ${WORDS[b]}?`, answer: a * b };
    if (!avoid || c.prompt !== avoid.prompt) return c;
  }
}

export function isCorrect(c: GateChallenge, typed: string): boolean {
  return /^\d{1,3}$/.test(typed) && Number(typed) === c.answer;
}
