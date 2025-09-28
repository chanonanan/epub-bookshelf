import { db } from '@/db/schema';

export async function saveCover(
  fileId: string,
  provider: 'gdrive' | 'onedrive',
  blob: Blob,
) {
  const bitmap = await createImageBitmap(blob);

  // Compress to WebP
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);

  const compressed = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/webp', 0.7),
  );

  await db.covers.put({
    id: fileId,
    provider,
    blob: compressed,
    width: bitmap.width,
    height: bitmap.height,
    cachedAt: Date.now(),
  });
}
