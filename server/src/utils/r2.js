import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

/**
 * Checks whether all required Cloudflare R2 credentials are provided in environment variables.
 */
export const isR2Configured = () => {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
};

let r2ClientInstance = null;

/**
 * Returns a singleton instance of the AWS S3 client configured for Cloudflare R2.
 */
export const getR2Client = () => {
  if (!isR2Configured()) {
    return null;
  }

  if (!r2ClientInstance) {
    const accountId = (process.env.R2_ACCOUNT_ID || '').trim();
    r2ClientInstance = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: (process.env.R2_ACCESS_KEY_ID || '').trim(),
        secretAccessKey: (process.env.R2_SECRET_ACCESS_KEY || '').trim(),
      },
    });
  }

  return r2ClientInstance;
};

/**
 * Deletes an object from Cloudflare R2 by its public URL or storage key.
 */
export const deleteR2Object = async (imageUrlOrKey) => {
  if (!isR2Configured() || !imageUrlOrKey) return false;
  try {
    const r2Client = getR2Client();
    const bucketName = (process.env.R2_BUCKET_NAME || '').trim();

    let key = imageUrlOrKey;
    if (imageUrlOrKey.startsWith('http://') || imageUrlOrKey.startsWith('https://')) {
      const urlObj = new URL(imageUrlOrKey);
      key = urlObj.pathname.replace(/^\/+/, '');
    }

    if (!key) return false;

    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );
    return true;
  } catch (err) {
    console.warn('[R2 CLEANUP] Could not delete object from R2:', err.message);
    return false;
  }
};

export { PutObjectCommand, DeleteObjectCommand };
