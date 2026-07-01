export async function optimizeImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const imageBitmap = await createImageBitmap(file);

  const maxSize = 2400;
  let { width, height } = imageBitmap;

  if (width > height && width > maxSize) {
    height = Math.round((height * maxSize) / width);
    width = maxSize;
  } else if (height >= width && height > maxSize) {
    width = Math.round((width * maxSize) / height);
    height = maxSize;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(imageBitmap, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.82)
  );

  if (!blob) return file;

  const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
console.log("OPTIMIZE IMAGE RESULT", {
  originalName: file.name,
  originalSizeMB: (file.size / 1024 / 1024).toFixed(2),
  originalWidth: imageBitmap.width,
  originalHeight: imageBitmap.height,
  newWidth: width,
  newHeight: height,
  newSizeMB: (blob.size / 1024 / 1024).toFixed(2),
});
  return new File([blob], newName, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}