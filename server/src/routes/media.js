import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import cloudinary, { isCloudinaryConfigured } from '../utils/cloudinary.js';
import { isR2Configured, getR2Client, PutObjectCommand } from '../utils/r2.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Configure Multer Memory Storage (keep file in buffer for compression and upload)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit before compression
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WEBP, AVIF) are allowed.'), false);
    }
  },
});

/**
 * Automatically compresses, reorients, and converts any uploaded image into high-performance WebP.
 * Resizes max dimension to 1600px without enlargement, preserving ultra-sharp editorial quality
 * while reducing file size by 70% to 90%.
 */
async function compressImage(rawBuffer) {
  try {
    const pipeline = sharp(rawBuffer)
      .rotate() // auto-orient by EXIF orientation tag
      .resize({
        width: 1600,
        height: 2000,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality: 82,
        effort: 4, // thorough compression effort
      });

    const compressedBuffer = await pipeline.toBuffer();
    const metadata = await sharp(compressedBuffer).metadata();

    return {
      buffer: compressedBuffer,
      mimeType: 'image/webp',
      format: 'webp',
      width: metadata.width || 1600,
      height: metadata.height || 2000,
      size: compressedBuffer.length,
    };
  } catch (err) {
    console.warn('[MEDIA] Compression notice, falling back to original buffer:', err.message);
    return {
      buffer: rawBuffer,
      mimeType: 'image/jpeg',
      format: 'jpeg',
      width: 1600,
      height: 2000,
      size: rawBuffer.length,
    };
  }
}

/**
 * POST /api/admin/media/upload
 * Compresses images automatically, then uploads to Cloudflare R2 (preferred),
 * Cloudinary (secondary), or returns an optimized WebP Data URI preview.
 */
router.post(
  '/upload',
  requireAuth,
  requireAdmin,
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file was provided for upload.',
        });
      }

      // 1. Automatically compress the image buffer first
      const compressed = await compressImage(req.file.buffer);

      // 2. PRIMARY: Cloudflare R2 Storage (Zero egress fees, ultra-fast S3-compatible delivery)
      if (isR2Configured()) {
        try {
          const r2Client = getR2Client();
          const bucketName = (process.env.R2_BUCKET_NAME || '').trim();
          const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          const objectKey = `products/${fileId}.${compressed.format}`;

          await r2Client.send(
            new PutObjectCommand({
              Bucket: bucketName,
              Key: objectKey,
              Body: compressed.buffer,
              ContentType: compressed.mimeType,
              CacheControl: 'public, max-age=31536000, immutable',
            })
          );

          // Build public URL: use R2_PUBLIC_URL if provided, else construct standard endpoint
          let publicBaseUrl = (process.env.R2_PUBLIC_URL || '').trim().replace(/\/+$/, '');
          if (!publicBaseUrl) {
            const accountId = (process.env.R2_ACCOUNT_ID || '').trim();
            publicBaseUrl = `https://${bucketName}.${accountId}.r2.cloudflarestorage.com`;
          }

          const fileUrl = `${publicBaseUrl}/${objectKey}`;

          return res.status(200).json({
            success: true,
            message: 'Image automatically compressed and uploaded to Cloudflare R2.',
            url: fileUrl,
            storage: 'r2',
            key: objectKey,
            size: compressed.size,
            format: compressed.format,
            width: compressed.width,
            height: compressed.height,
          });
        } catch (r2Err) {
          console.error('[MEDIA] Cloudflare R2 upload error, attempting fallback:', r2Err);
        }
      }

      // 3. SECONDARY: Cloudinary Storage (if configured)
      if (isCloudinaryConfigured()) {
        return new Promise((resolve) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'penny/products',
              resource_type: 'image',
              format: 'webp',
              transformation: [
                { quality: 'auto:best', fetch_format: 'auto' },
                { width: 1600, crop: 'limit' },
              ],
            },
            (error, result) => {
              if (error) {
                console.error('[MEDIA] Cloudinary upload stream error:', error);
                return resolve(
                  res.status(500).json({
                    success: false,
                    message: 'Failed to upload media to Cloudinary CDN.',
                    error: error.message,
                  })
                );
              }

              return resolve(
                res.status(200).json({
                  success: true,
                  message: 'Image automatically compressed and uploaded to Cloudinary.',
                  url: result.secure_url,
                  storage: 'cloudinary',
                  publicId: result.public_id,
                  width: result.width,
                  height: result.height,
                  format: result.format,
                  size: compressed.size,
                })
              );
            }
          );

          uploadStream.end(compressed.buffer);
        });
      }

      // 4. FALLBACK: Optimized WebP Data URI (when external storage credentials are not yet set)
      const base64Data = compressed.buffer.toString('base64');
      const dataUri = `data:${compressed.mimeType};base64,${base64Data}`;

      return res.status(200).json({
        success: true,
        message: 'Image compressed. Stored as optimized WebP data URI (configure R2 credentials in .env for CDN hosting).',
        url: dataUri,
        storage: 'local-compressed',
        publicId: `compressed-${Date.now()}`,
        size: compressed.size,
        format: compressed.format,
        width: compressed.width,
        height: compressed.height,
        isFallback: true,
      });
    } catch (error) {
      console.error('[MEDIA] Media upload route error:', error);
      return res.status(500).json({
        success: false,
        message: 'An unexpected error occurred while processing media upload.',
        error: error.message,
      });
    }
  }
);

export default router;
