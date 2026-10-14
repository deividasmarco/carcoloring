/**
 * Minimal key → text/bytes storage used for drawings and settings.
 * Native implementation: files in the app's document directory.
 */
import { Directory, File, Paths } from 'expo-file-system';

export interface BlobStore {
  readText(key: string): Promise<string | null>;
  writeText(key: string, text: string): Promise<void>;
  readBytes(key: string): Promise<Uint8Array | null>;
  writeBytes(key: string, bytes: Uint8Array): Promise<void>;
  remove(key: string): Promise<void>;
  /** Local file URI for a key, when the platform has one (used for sharing). */
  uriFor?(key: string): string | null;
  /** An address an <Image> can show a stored PNG from (file URI, or a data URI on the web). */
  imageUri?(key: string): Promise<string | null>;
}

const ROOT = 'neon-bay';

function fileFor(key: string): File {
  const parts = key.split('/');
  const name = parts.pop()!;
  const dir = new Directory(Paths.document, ROOT, ...parts);
  if (!dir.exists) dir.create({ intermediates: true });
  return new File(dir, name);
}

/** Writes to a temporary file first, then moves it into place. */
function writeAtomically(key: string, content: string | Uint8Array) {
  const target = fileFor(key);
  const tmp = new File(target.parentDirectory, `${target.name}.tmp`);
  if (tmp.exists) tmp.delete();
  tmp.create();
  tmp.write(content);
  tmp.moveSync(target, { overwrite: true });
}

export const blobStore: BlobStore = {
  async readText(key) {
    const f = fileFor(key);
    return f.exists ? f.text() : null;
  },
  async writeText(key, text) {
    writeAtomically(key, text);
  },
  async readBytes(key) {
    const f = fileFor(key);
    return f.exists ? f.bytes() : null;
  },
  async writeBytes(key, bytes) {
    writeAtomically(key, bytes);
  },
  async remove(key) {
    const f = fileFor(key);
    if (f.exists) f.delete();
  },
  uriFor(key) {
    const f = fileFor(key);
    return f.exists ? f.uri : null;
  },
  async imageUri(key) {
    const f = fileFor(key);
    return f.exists ? f.uri : null;
  },
};
