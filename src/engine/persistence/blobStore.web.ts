/** Web fallback: localStorage, with bytes stored as base64. */
import { fromBase64, toBase64 } from '../regions/hitMap';
import type { BlobStore } from './blobStore';

export type { BlobStore } from './blobStore';

const PREFIX = 'neon-bay/';

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export const blobStore: BlobStore = {
  async readText(key) {
    return storage()?.getItem(PREFIX + key) ?? null;
  },
  async writeText(key, text) {
    storage()?.setItem(PREFIX + key, text);
  },
  async readBytes(key) {
    const s = storage()?.getItem(PREFIX + key);
    return s ? fromBase64(s) : null;
  },
  async writeBytes(key, bytes) {
    storage()?.setItem(PREFIX + key, toBase64(bytes));
  },
  async remove(key) {
    storage()?.removeItem(PREFIX + key);
  },
  uriFor() {
    return null;
  },
  async imageUri(key) {
    const s = storage()?.getItem(PREFIX + key);
    return s ? `data:image/png;base64,${s}` : null;
  },
};
