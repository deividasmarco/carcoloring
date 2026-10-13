/**
 * Guards against web-only code leaking into native bundles. Metro bundles
 * every `require`/`import` it can see, even inside `Platform.OS === 'web'`
 * branches, so web-only modules may only be referenced from `*.web.ts(x)`
 * files (selected by platform extension).
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = join(__dirname, '..');
const WEB_ONLY = [/canvaskit-wasm/, /react-native-skia\/lib\/(module|commonjs)\/web/, /\bLoadSkiaWeb\b/, /\bWithSkiaWeb\b/];

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return sources(p);
    return /\.(ts|tsx)$/.test(name) ? [p] : [];
  });
}

test('native code never references web-only Skia modules', () => {
  const files = [join(ROOT, 'index.ts'), ...sources(join(ROOT, 'src'))].filter((f) => !/\.web\.tsx?$/.test(f));
  const offenders = files.filter((f) => {
    const code = readFileSync(f, 'utf8');
    return WEB_ONLY.some((re) => re.test(code));
  });
  expect(offenders.map((f) => relative(ROOT, f))).toEqual([]);
});

test('the web entry still loads CanvasKit before the router', () => {
  const web = readFileSync(join(ROOT, 'src', 'bootstrap.web.ts'), 'utf8');
  expect(web).toMatch(/LoadSkiaWeb\([\s\S]*\)\.then\([\s\S]*expo-router\/entry/);
});
