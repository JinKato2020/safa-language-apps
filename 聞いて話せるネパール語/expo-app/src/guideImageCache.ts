// Optional future pack images are stored independently from lesson/audio packs.
// Existing illustrations are bundled, so they also work before the first download.
import * as FileSystem from 'expo-file-system/legacy';
import type { GuideImage, GuideImageResolver } from '@safa/shared';
import { CULTURE_IMAGES } from './cultureImages';

const pending = new Map<string, ReturnType<GuideImageResolver>>();
async function cachedImage(image: GuideImage) {
  if (!/^[a-f0-9]{64}$/.test(image.sha256)) return null;
  const bundled = CULTURE_IMAGES[image.sha256];
  if (bundled) return bundled;
  if (!/^https:\/\//.test(image.uri) || !FileSystem.documentDirectory) return null;
  const dir = `${FileSystem.documentDirectory}guide-images/`;
  const uri = `${dir}${image.sha256}.jpg`, temp = `${uri}.part`;
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists && info.size > 0) return { uri };
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  try {
    const response = await FileSystem.downloadAsync(image.uri, temp);
    const downloaded = await FileSystem.getInfoAsync(temp);
    if (response.status !== 200 || !downloaded.exists || downloaded.size === 0) return null;
    await FileSystem.moveAsync({ from: temp, to: uri });
    return { uri };
  } finally {
    await FileSystem.deleteAsync(temp, { idempotent: true }).catch(() => {});
  }
}

export const resolveGuideImage: GuideImageResolver = image => {
  const key = image.sha256;
  const existing = pending.get(key);
  if (existing) return existing;
  const request = cachedImage(image).catch(() => null).finally(() => pending.delete(key));
  pending.set(key, request);
  return request;
};
