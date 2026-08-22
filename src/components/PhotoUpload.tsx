"use client";

import { useRef, useState } from "react";

type PhotoUploadProps = {
  name: string; // hidden input name each dataUrl will be posted under
  initialPhotos?: string[];
  maxPhotos?: number;
};

// Longest side a stored photo is allowed to be, and the JPEG quality used
// when re-encoding. A modern phone photo is routinely 3-5MB straight off the
// camera; three or four of those in one form submission blow past both
// Next.js's server-action body limit and Vercel's hard 4.5MB request cap
// (which can't be raised). Downscaling client-side before it ever becomes a
// data URI keeps a full 8-photo item comfortably under a few hundred KB.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Downscales an image file to at most MAX_DIMENSION on its longest side and
 * re-encodes it as a JPEG data URI, so it's small enough to embed inline.
 * `imageOrientation: "from-image"` makes createImageBitmap bake in the
 * photo's EXIF rotation (phone photos are very often shot sideways/upside
 * down relative to their stored pixels) so it doesn't get lost once the
 * canvas flattens the pixels. Falls back to the original, uncompressed data
 * URI if the browser can't decode the image (e.g. an unsupported format) or
 * lacks canvas/createImageBitmap support, rather than dropping the photo.
 */
async function compressImage(file: File): Promise<string> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return readAsDataUrl(file);
  }

  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return readAsDataUrl(file);

    ctx.drawImage(bitmap, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } finally {
    bitmap.close();
  }
}

/**
 * Lets the user pick one or more image files, downscales + re-encodes each
 * one client-side (see compressImage above) and converts the result to a
 * base64 data URI (no external object storage needed for the prototype —
 * see README for moving this to S3/Cloudinary in production), and renders
 * hidden inputs so a normal <form> submit (server action) carries the
 * resulting data URIs as repeated `name` fields.
 */
export default function PhotoUpload({ name, initialPhotos = [], maxPhotos = 6 }: PhotoUploadProps) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const remaining = maxPhotos - photos.length;
    if (remaining <= 0) {
      setError(`You can upload up to ${maxPhotos} photos.`);
      return;
    }

    const toRead = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, remaining);

    setBusy(true);
    try {
      const results = await Promise.all(toRead.map(compressImage));
      setPhotos((prev) => [...prev, ...results]);
    } catch {
      setError("Couldn't process one of those photos — try a different file.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div>
      <label className="label">Photos</label>

      {photos.length > 0 && (
        <div className="mb-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {photos.map((p, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-ink-600">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              <input type="hidden" name={name} value={p} />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 py-0.5 text-xs text-bone opacity-0 transition-opacity group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length < maxPhotos && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={busy}
          onChange={(e) => handleFiles(e.target.files)}
          className="block w-full text-sm text-ink-300 file:mr-3 file:rounded-lg file:border-0 file:bg-ink-700 file:px-3 file:py-2 file:text-sm file:text-bone hover:file:bg-ink-600 disabled:opacity-60"
        />
      )}

      {busy && <p className="mt-1 text-xs text-ink-400">Processing photo(s)…</p>}
      {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
      <p className="mt-1 text-xs text-ink-500">
        Up to {maxPhotos} photos. Resized and stored inline for this prototype.
      </p>
    </div>
  );
}
