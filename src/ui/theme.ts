/**
 * Neon Bay design tokens.
 *
 * Surfaces are near-black and midnight blue; electric cyan is the one
 * interaction colour (selection, primary action). Magenta and amber stay
 * environmental (garage lighting, turntables) and small accents.
 *
 * Type has three jobs:
 * - display (Michroma): the wordmark, vehicle names and screen titles only;
 * - label (Chakra Petch): short upper-case labels, counters and buttons;
 * - body (Atkinson Hyperlegible Next): instructions, parent information and
 *   anything longer than a few words.
 *
 * Glow is reserved for the main action and selected controls.
 */
export const colors = {
  bg: '#06080E',
  surface: '#0C111C',
  surfaceRaised: '#131A29',
  surfaceSunken: '#080B13',
  line: '#1E2840',
  lineStrong: '#2C3958',
  text: '#E9EEF7',
  /** Supporting text: 6.5:1 on bg. */
  textDim: '#8793AB',
  /** Least important readable text (counters, captions): 4.7:1 on bg. */
  textFaint: '#6E7B96',
  cyan: '#22E4FF',
  cyanSoft: 'rgba(34, 228, 255, 0.16)',
  cyanGlow: 'rgba(34, 228, 255, 0.45)',
  magenta: '#FF3D9A',
  amber: '#FFB23E',
  /** Behind a dialog. */
  scrim: 'rgba(3, 5, 10, 0.78)',
} as const;

export const fonts = {
  /** Wide automotive display face: the wordmark, vehicle names and titles only. */
  display: 'Michroma_400Regular',
  label: 'ChakraPetch_600SemiBold',
  labelBold: 'ChakraPetch_700Bold',
  /** Readable text: instructions, parent information, longer copy. */
  body: 'AtkinsonHyperlegibleNext_400Regular',
  bodyMedium: 'AtkinsonHyperlegibleNext_500Medium',
  bodyBold: 'AtkinsonHyperlegibleNext_700Bold',
} as const;

export const space = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;

export const radius = { s: 10, m: 16, l: 22, pill: 999 } as const;

/** Text styles. Upper-case labels use letter spacing; body text never does. */
export const type = {
  /** Small upper-case tag: BAY 04, PREMIUM, filter chips. */
  caption: { fontFamily: fonts.label, fontSize: 12, letterSpacing: 2.5 },
  /** Button and control labels. */
  label: { fontFamily: fonts.label, fontSize: 15, letterSpacing: 1.5 },
  /** Screen titles. */
  title: { fontFamily: fonts.display, fontSize: 18, letterSpacing: 3 },
  /** Section headings in readable text. */
  heading: { fontFamily: fonts.bodyBold, fontSize: 20, lineHeight: 26 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23 },
  bodySmall: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
} as const;

/** Control states shared by every screen. */
export const control = {
  /** Smallest touch target (dp). */
  minTouch: 48,
  pressedOpacity: 0.82,
  disabledOpacity: 0.4,
  /** The one glow: main action and selected controls. */
  glow: { shadowColor: colors.cyan, shadowOpacity: 0.6, shadowRadius: 18, shadowOffset: { width: 0, height: 0 }, elevation: 10 },
} as const;

/** Minimum touch target for small hands (dp). */
export const TOUCH = 56;

/** Curated crayon box: distinct hues that stay distinguishable on the car. */
export const PALETTE: { id: string; name: string; color: string }[] = [
  { id: 'red', name: 'Racing red', color: '#E5322D' },
  { id: 'orange', name: 'Sunset orange', color: '#FF7A1A' },
  { id: 'yellow', name: 'Taxi yellow', color: '#FFD21F' },
  { id: 'lime', name: 'Lime', color: '#7ED321' },
  { id: 'green', name: 'Racing green', color: '#159A52' },
  { id: 'cyan', name: 'Electric blue', color: '#1FC3E8' },
  { id: 'blue', name: 'Royal blue', color: '#2F5BEA' },
  { id: 'purple', name: 'Purple', color: '#7B4BD8' },
  { id: 'pink', name: 'Hot pink', color: '#FF4FA3' },
  { id: 'white', name: 'White', color: '#F7F7F2' },
  { id: 'silver', name: 'Silver', color: '#9AA3AF' },
  { id: 'black', name: 'Black', color: '#1D1F25' },
];
