import { NextResponse } from "next/server";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import { requireUser } from "@/lib/auth/server";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported image type. Use JPG, PNG, WebP, GIF or AVIF." },
        { status: 415 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image is larger than 5 MB." },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(buffer).metadata();

    if (!metadata.width || !metadata.height) {
      return NextResponse.json(
        { error: "Could not read the image." },
        { status: 422 }
      );
    }

    // Re-encode to strip EXIF/GPS and normalise avatar size.
    const processedBuffer = await sharp(buffer)
      .rotate()
      .resize(512, 512, { fit: "cover", position: "centre" })
      .webp({ quality: 85 })
      .toBuffer();

    const result = await new Promise<{ secure_url: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `ecommerce/avatars/${user.uid}`,
            resource_type: "image",
            public_id: `avatar-${Date.now()}`,
            overwrite: false,
          },
          (error, uploaded) => {
            if (error || !uploaded) reject(error ?? new Error("Upload failed"));
            else resolve(uploaded as { secure_url: string });
          }
        );

        Readable.from(processedBuffer).pipe(uploadStream);
      }
    );

    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    console.error("Error in avatar upload API:", error);
    return NextResponse.json({ error: "Avatar upload failed." }, { status: 500 });
  }
}
