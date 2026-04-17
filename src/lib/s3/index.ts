import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { env } from '@/lib/env';

/**
 * Singleton S3 client instance.
 * Shared across all server-side operations.
 */
const s3Client = new S3Client({
  region: env.AWS_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY ?? '',
  },
});

export type S3BucketType = 'members' | 'transactions';

function getBucketName(type: S3BucketType): string {
  const bucketName = type === 'members' ? env.S3_MEMBERS_BUCKET : env.S3_TRANSACTIONS_BUCKET;
  if (!bucketName) {
    throw new Error(`S3 bucket name for type "${type}" is not configured in environment.`);
  }
  return bucketName;
}

/**
 * Generates a short-lived pre-signed URL for viewing/downloading an object.
 *
 * @param bucketType - The logical bucket to use (members or transactions)
 * @param key - The S3 object key
 * @param expiresIn - Expiration time in seconds (default: 3600 / 1 hour)
 */
export async function getPresignedDownloadUrl(
  bucketType: S3BucketType,
  key: string,
  expiresIn = 3600,
): Promise<string | null> {
  if (!key) return null;

  try {
    const command = new GetObjectCommand({
      Bucket: getBucketName(bucketType),
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error('Error generating pre-signed download URL:', error);
    return null;
  }
}

/**
 * Generates a pre-signed URL for client-side upload.
 *
 * @param bucketType - The logical bucket to use (members or transactions)
 * @param key - The S3 object key (destination path in bucket)
 * @param contentType - The MIME type of the file
 * @param expiresIn - Expiration time in seconds (default: 600 / 10 minutes)
 */
export async function getPresignedUploadUrl(
  bucketType: S3BucketType,
  key: string,
  contentType: string,
  expiresIn = 600,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: getBucketName(bucketType),
    Key: key,
    ContentType: contentType,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

export async function deleteS3Object(bucketType: S3BucketType, key: string | null): Promise<void> {
  if (!key) return;

  try {
    const command = new DeleteObjectCommand({
      Bucket: getBucketName(bucketType),
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    // We log but don't throw, as S3 cleanup is a non-critical background-style task
    // and shouldn't crash the main DB transaction/action flow.
    console.error(`Failed to delete S3 object (Bucket: ${bucketType}, Key: ${key}):`, error);
  }
}

export async function getS3ObjectSize(
  bucketType: S3BucketType,
  key: string | null,
): Promise<number | null> {
  if (!key) return null;

  try {
    const command = new HeadObjectCommand({
      Bucket: getBucketName(bucketType),
      Key: key,
    });

    const response = await s3Client.send(command);
    return response.ContentLength ?? null;
  } catch (error) {
    console.error(`Failed to read S3 object size (Bucket: ${bucketType}, Key: ${key}):`, error);
    return null;
  }
}

export { s3Client };

function sanitizeFileName(fileName: string): string {
  const normalized = fileName.trim().toLowerCase();
  const sanitized = normalized
    .replaceAll(/[^a-z0-9._-]+/g, '-')
    .replaceAll(/-+/g, '-')
    .slice(0, 120);
  return sanitized.length > 0 ? sanitized : 'attachment';
}

export function buildTransactionAttachmentKey(fileName: string): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const safeName = sanitizeFileName(fileName);
  const randomSuffix = crypto.randomUUID().slice(0, 8);
  const timestamp = Date.now();

  return `transactions/${year}/${month}/${timestamp}-${randomSuffix}-${safeName}`;
}

export function buildMemberPhotoKey(fileName: string): string {
  const safeName = sanitizeFileName(fileName);
  const randomSuffix = crypto.randomUUID().slice(0, 8);
  const timestamp = Date.now();
  return `member-photos/${timestamp}-${randomSuffix}-${safeName}`;
}
