import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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

export { PutObjectCommand };
