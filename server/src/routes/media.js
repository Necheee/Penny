import express from 'express';
import multer from 'multer';
import cloudinary, { isCloudinaryConfigured } from '../utils/cloudinary.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Configure Multer Memory Storage (keep file in buffer for stream upload)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WEBP) are allowed.'), false);
    }
  },
});

/**
 * POST /api/admin/media/upload
 * Securely uploads an image to Cloudinary (or returns base64 dataURI fallback if credentials not yet configured)
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

      // Check if Cloudinary credentials are fully configured
      if (isCloudinaryConfigured()) {
        // Stream buffer directly to Cloudinary with luxury format optimizations
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
              console.error('Cloudinary upload stream error:', error);
              return res.status(500).json({
                success: false,
                message: 'Failed to upload media to Cloudinary CDN.',
                error: error.message,
              });
            }

            return res.status(200).json({
              success: true,
              message: 'Image uploaded successfully to Cloudinary.',
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
              format: result.format,
            });
          }
        );

        uploadStream.end(req.file.buffer);
      } else {
        // Fallback: If developer/owner has not yet pasted Cloudinary keys in .env,
        // create an inline high-quality Data URI so admin operations never break.
        const base64Data = req.file.buffer.toString('base64');
        const dataUri = `data:${req.file.mimetype};base64,${base64Data}`;

        return res.status(200).json({
          success: true,
          message: 'Cloudinary credentials pending in .env. Stored local DataURI preview.',
          url: dataUri,
          publicId: `local-${Date.now()}`,
          isFallback: true,
        });
      }
    } catch (error) {
      console.error('Media upload route error:', error);
      return res.status(500).json({
        success: false,
        message: 'An unexpected error occurred while processing media upload.',
      });
    }
  }
);

export default router;
