import { ImageFormat, type SkImage } from '@shopify/react-native-skia';
import { File, Paths } from 'expo-file-system';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import * as Sharing from 'expo-sharing';

function writePng(image: SkImage, name: string): File {
  const file = new File(Paths.cache, `${name}.png`);
  if (file.exists) file.delete();
  file.create();
  file.write(image.encodeToBytes(ImageFormat.PNG, 100));
  return file;
}

export type SaveResult = 'saved' | 'denied' | 'failed';

/** Saves the artwork to the photo library (asks for add-only permission). */
export async function saveArtwork(image: SkImage, name: string): Promise<SaveResult> {
  try {
    const perm = await requestPermissionsAsync(true);
    if (!perm.granted) return 'denied';
    const file = writePng(image, name);
    await Asset.create(file.uri);
    return 'saved';
  } catch (e) {
    console.warn('Saving to photos failed', e);
    return 'failed';
  }
}

export async function shareArtwork(image: SkImage, name: string): Promise<boolean> {
  try {
    if (!(await Sharing.isAvailableAsync())) return false;
    const file = writePng(image, name);
    await Sharing.shareAsync(file.uri, { mimeType: 'image/png', dialogTitle: 'Share your car', UTI: 'public.png' });
    return true;
  } catch (e) {
    console.warn('Sharing failed', e);
    return false;
  }
}
