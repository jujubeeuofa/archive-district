"use client";

import { useRef, useState } from "react";

type PhotoUploadProps = {
  name: string; // hidden input name each dataUrl will be posted under
  initialPhotos?: string[];
  maxPhotos?: number;
};

/**
 * Lets the user pick one or more image files, converts them to base64 data
 * URIs client-side (no external object storage needed for the prototype —
 * see README for moving this to S3/Cloudinary in production), and renders
 * hidden inputs so a normal <form> submit (server action) carries the
 * resulting data URIs as repeated `name` fields.
 */
export default function PhotoUpload({ name, initialPhotos = [], maxPhotos = 6 }: PhotoUploadProps) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const remaining = maxPhotos - photos.length;
    if (remaining <= 0) {
      setError(`You can upload up to ${maxPhotos} photos.`);
      return;
    }

    const toRead = Array.from(files).slice(0, remaining);
    const results: string[] = [];

    for (const file of toRead) {
      if (!file.type.startsWith("image/")) continue;
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      results.push(dataUrl);
    }

    setPhotos((prev) => [...prev, ...results]);
    if (inputRef.current) inputRef.current.value = "";
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
          onChange={(e) => handleFiles(e.target.files)}
          className="block w-full text-sm text-ink-300 file:mr-3 file:rounded-lg file:border-0 file:bg-ink-700 file:px-3 file:py-2 file:text-sm file:text-bone hover:file:bg-ink-600"
        />
      )}

      {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
      <p className="mt-1 text-xs text-ink-500">
        Up to {maxPhotos} photos. Stored inline as base64 for this prototype.
      </p>
    </div>
  );
}
