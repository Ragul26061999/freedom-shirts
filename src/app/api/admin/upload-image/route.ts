import { NextResponse } from "next/server";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import { requireAdmin } from "@/lib/auth/server";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const MIN_DIMENSION = 500; // blueprint rule for catalog images
const MAX_DIMENSION = 6000;

export async function POST(request: Request) {
  try {
    // Only verified admins may upload product media.
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported image type. Use JPG, PNG, WebP or AVIF." },
        { status: 415 },
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image is larger than 10 MB." },
        { status: 413 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate real dimensions (magic-byte validation is handled by sharp).
    const metadata = await sharp(buffer).metadata();
    if (
      !metadata.width ||
      !metadata.height ||
      metadata.width < MIN_DIMENSION ||
      metadata.height < MIN_DIMENSION
    ) {
      return NextResponse.json(
        {
          error: `Image must be at least ${MIN_DIMENSION}×${MIN_DIMENSION}px.`,
        },
        { status: 422 },
      );
    }
    if (
      metadata.width > MAX_DIMENSION ||
      metadata.height > MAX_DIMENSION
    ) {
      return NextResponse.json(
        { error: `Image must be at most ${MAX_DIMENSION}px on each side.` },
        { status: 422 },
      );
    }

    // Re-encode to strip EXIF/GPS and normalise size.
    const processedBuffer = await sharp(buffer)
      .rotate() // honour EXIF orientation before stripping metadata
      .resize(1200, null, { withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const result = await new Promise<{ secure_url: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "ecommerce", resource_type: "image" },
          (error, uploaded) => {
            if (error || !uploaded) reject(error ?? new Error("Upload failed"));
            else resolve(uploaded as { secure_url: string });
          },
        );

        Readable.from(processedBuffer).pipe(uploadStream);
      },
    );

    return NextResponse.json({ url: result.secure_url });
  } catch (error: unknown) {
    console.error("Error in image upload API:", error);
    return NextResponse.json(
      { error: "Image upload failed." },
      { status: 500 },
    );
  }
}
