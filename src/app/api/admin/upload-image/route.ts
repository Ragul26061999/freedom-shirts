import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compress and resize using Sharp
    const processedBuffer = await sharp(buffer)
      .resize(800, null, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // Upload to Cloudinary via stream
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'ecommerce' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      const stream = require('stream');
      const readableStream = new stream.PassThrough();
      readableStream.end(processedBuffer);
      readableStream.pipe(uploadStream);
    });

    return NextResponse.json({ url: (result as any).secure_url });
  } catch (error: any) {
    console.error('Error in image upload API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
