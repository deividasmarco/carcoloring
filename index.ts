/**
 * App entry. Platform-specific startup lives in src/bootstrap(.web).ts and is
 * selected by Metro's platform extensions, never by a runtime check, so
 * web-only code cannot leak into native development bundles.
 */
import './src/bootstrap';
