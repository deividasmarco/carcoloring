import { ImageFormat, type SkImage } from '@shopify/react-native-skia';

export type SaveResult = 'saved' | 'denied' | 'failed';

function pngBlob(image: SkImage) {
  const bytes = image.encodeToBytes(ImageFormat.PNG, 100);
  return new Blob([bytes as BlobPart], { type: 'image/png' });
}

/** Browser: download the PNG. */
export async function saveArtwork(image: SkImage, name: string): Promise<SaveResult> {
  try {
    const url = URL.createObjectURL(pngBlob(image));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return 'saved';
  } catch {
    return 'failed';
  }
}

export async function shareArtwork(image: SkImage, name: string): Promise<boolean> {
  try {
    const file = new File([pngBlob(image)], `${name}.png`, { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      await nav.share({ files: [file], title: 'My car' });
      return true;
    }
  } catch {
    // Fall through to a download.
  }
  return (await saveArtwork(image, name)) === 'saved';
}
