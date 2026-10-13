/**
 * Neon Bay design tokens.
 *
 * Surfaces are charcoal and midnight blue; electric cyan is the one
 * interaction colour (selection, primary action). Magenta and amber appear
 * only as small accents (the wash confirmation, the finish flag).
 */
export const colors = {
  bg: '#06080E',
  surface: '#0C111C',
  surfaceRaised: '#131A29',
  surfaceSunken: '#080B13',
  line: '#1E2840',
  lineStrong: '#2C3958',
  text: '#E9EEF7',
  textDim: '#8793AB',
  textFaint: '#56627C',
  cyan: '#22E4FF',
  cyanSoft: 'rgba(34, 228, 255, 0.16)',
  cyanGlow: 'rgba(34, 228, 255, 0.45)',
  magenta: '#FF3D9A',
  amber: '#FFB23E',
} as const;

export const fonts = {
  /** Wide automotive display face — nameplates and the wordmark only. */
  display: 'Michroma_400Regular',
  label: 'ChakraPetch_600SemiBold',
  labelBold: 'ChakraPetch_700Bold',
  body: 'ChakraPetch_500Medium',
} as const;

export const space = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;

export const radius = { s: 10, m: 16, l: 22, pill: 999 } as const;

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
