import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
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
}

/**
 * POST /api/admin/media/upload
 * Exclusively uploads to Cloudflare R2 with automatic WebP compression.
 * Rejects if Cloudflare R2 credentials are not configured.
 */
router.post(
  '/upload',
  requireAuth,
  requireAdmin,
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            message: 'Image exceeds the maximum allowed file size of 15MB.',
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'Invalid image file provided.',
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file was provided for upload.',
        });
      }

      // Verify Cloudflare R2 configuration strictly
      if (!isR2Configured()) {
        return res.status(500).json({
          success: false,
          message: 'Cloudflare R2 storage is not configured. Please populate R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME in your environment variables.',
        });
      }

      // Verify public R2 URL configuration to avoid returning broken 403 S3 endpoints
      const publicBaseUrl = (process.env.R2_PUBLIC_URL || '').trim().replace(/\/+$/, '');
      if (!publicBaseUrl) {
        return res.status(500).json({
          success: false,
          message: 'Cloudflare R2 Public URL (R2_PUBLIC_URL) is not configured in server/.env. Public image access requires a public custom domain or r2.dev URL.',
        });
      }

      // 1. Automatically compress the image buffer first with sharp
      const compressed = await compressImage(req.file.buffer);

      // 2. Upload directly to Cloudflare R2 bucket
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
    } catch (error) {
      console.error('[MEDIA] Cloudflare R2 upload error:', error);
      return res.status(500).json({
        success: false,
        message: `Failed to upload image to Cloudflare R2: ${error.message}`,
      });
    }
  }
);

export default router;
