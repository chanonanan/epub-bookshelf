export async function resizeImageBlob(
  blob: Blob,
  maxWidth = 200,
): Promise<Blob> {
  const img = await createImageBitmap(blob);
  const scale = Math.min(1, maxWidth / img.width);

  const canvas = document.createElement('canvas');
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;

  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return await new Promise<Blob>((resolve) =>
    canvas.toBlob((resized) => resolve(resized!), 'image/webp', 0.7),
  );
}
