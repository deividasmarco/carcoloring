/**
 * Native (iOS/Android) startup: register the router synchronously.
 * The web counterpart, bootstrap.web.ts, loads CanvasKit first. Metro picks
 * the file by platform extension, so the web-only loader (and CanvasKit,
 * which references Node's `fs`) never enters native bundles.
 */
import 'expo-router/entry';
