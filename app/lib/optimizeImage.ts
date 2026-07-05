export async function optimizeImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("This file is not an image.");
  }

  let imageBitmap: ImageBitmap;

  try {
    imageBitmap = await createImageBitmap(file);
  } catch (error) {
    console.error("IMAGE DECODE FAILED", error);
    throw new Error(
      `"${file.name}" could not be processed. Please try saving it as a JPG or PNG and upload it again.`
    );
  }

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

  if (!ctx) {
    imageBitmap.close();
    throw new Error(`"${file.name}" could not be processed.`);
  }

  ctx.drawImage(imageBitmap, 0, 0, width, height);
  imageBitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.82)
  );

  if (!blob) {
    throw new Error(`"${file.name}" could not be converted to JPG.`);
  }

  const baseName =
    file.name.replace(/\.[^.]+$/, "") || `photo-${Date.now()}`;

  const optimizedFile = new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });

  console.log("OPTIMIZE IMAGE RESULT", {
    originalName: file.name,
    originalType: file.type,
    originalSizeMB: (file.size / 1024 / 1024).toFixed(2),
    newName: optimizedFile.name,
    newType: optimizedFile.type,
    newSizeMB: (optimizedFile.size / 1024 / 1024).toFixed(2),
    newWidth: width,
    newHeight: height,
  });

  return optimizedFile;
}