export async function createPhotoFingerprint(file: File): Promise<string> {
  const fileBuffer = await file.arrayBuffer();

  if (globalThis.crypto?.subtle) {
    const hashBuffer = await globalThis.crypto.subtle.digest(
      "SHA-256",
      fileBuffer
    );

    return Array.from(new Uint8Array(hashBuffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  // Fallback for browsers where SubtleCrypto is unavailable.
  return `${file.name}:${file.size}:${file.lastModified}`;
}