export class ImageError extends Error {
  constructor(public code: "type" | "size" | "decode") {
    super(code);
  }
}

const MAX_INPUT_BYTES = 12 * 1024 * 1024;
const MAX_PIXELS = 50_000_000; // about 7000 x 7000, far above any phone photo

/**
 * Downscale an uploaded picture in the browser and return a compact JPEG data URL.
 * Demo storage only (localStorage has a few MB): the real backend stores files in a private bucket.
 * Accepts JPEG, PNG and WebP; anything else (including SVG, which can carry scripts) is rejected.
 */
export async function resizeImage(file: File, maxSide = 1200, quality = 0.8): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new ImageError("type");
  if (file.size > MAX_INPUT_BYTES) throw new ImageError("size");

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new ImageError("decode");
  });
  // A small file can still decode to an enormous bitmap (a "decompression bomb"): refuse before allocating a canvas.
  if (bitmap.width * bitmap.height > MAX_PIXELS) {
    bitmap.close();
    throw new ImageError("size");
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ImageError("decode");
  ctx.fillStyle = "#fff"; // flatten transparency
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}
