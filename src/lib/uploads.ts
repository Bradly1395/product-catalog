import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
const UPLOADS_URL_PREFIX = "/uploads/";

const SAFE_FILENAME_RE = /^[a-zA-Z0-9_-]+\.(jpg|png|webp|gif|avif)$/;

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

export function getUploadsDir(): string {
  return path.resolve(process.cwd(), "public", "uploads");
}

function detectImageExtension(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }

  // GIF: GIF87a or GIF89a
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return "gif";
  }

  // WebP: RIFF....WEBP
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }

  // AVIF: ....ftypavif or ....ftypavis
  if (buffer.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = buffer.subarray(8, 12).toString("ascii");
    if (brand === "avif" || brand === "avis") {
      return "avif";
    }
  }

  return null;
}

export async function saveUploadedImage(file: File): Promise<string> {
  if (file.size === 0) {
    throw new Error("Uploaded file is empty.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Image exceeds the 5 MB upload limit.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = detectImageExtension(buffer);

  if (!ext) {
    throw new Error(
      "Unsupported image format. Please upload a JPG, PNG, WebP, GIF, or AVIF image."
    );
  }

  const uploadsDir = getUploadsDir();
  await fs.mkdir(uploadsDir, { recursive: true });

  const filename = `${crypto.randomUUID()}.${ext}`;
  const destination = path.join(uploadsDir, filename);

  await fs.writeFile(destination, buffer);
  return `${UPLOADS_URL_PREFIX}${filename}`;
}

export async function deleteUploadedImage(
  imagePath: string | null | undefined
): Promise<void> {
  if (!imagePath || !imagePath.startsWith(UPLOADS_URL_PREFIX)) {
    return;
  }

  const filename = imagePath.slice(UPLOADS_URL_PREFIX.length);
  if (!SAFE_FILENAME_RE.test(filename)) {
    return;
  }

  const uploadsDir = getUploadsDir();
  const target = path.resolve(uploadsDir, filename);
  if (!target.startsWith(`${uploadsDir}${path.sep}`)) {
    return;
  }

  try {
    await fs.unlink(target);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      console.error("Failed to remove uploaded image:", err);
    }
  }
}

export async function readUploadedImage(
  filename: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!SAFE_FILENAME_RE.test(filename)) {
    return null;
  }

  const uploadsDir = getUploadsDir();
  const target = path.resolve(uploadsDir, filename);
  if (!target.startsWith(`${uploadsDir}${path.sep}`)) {
    return null;
  }

  try {
    const buffer = await fs.readFile(target);
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const contentType = CONTENT_TYPE_BY_EXT[ext] || "application/octet-stream";
    return { buffer, contentType };
  } catch {
    return null;
  }
}
