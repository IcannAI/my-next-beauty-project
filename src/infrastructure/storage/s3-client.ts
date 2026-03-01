import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const region = process.env.AWS_REGION || 'auto';
const bucketName = process.env.S3_BUCKET_NAME;
const endpoint = process.env.S3_ENDPOINT;

const s3Client = new S3Client({
  region,
  endpoint,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function uploadEvidenceFile(
  file: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  if (!bucketName) {
    throw new Error('S3_BUCKET_NAME is not defined in environment variables');
  }

  const key = `evidence/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file,
    ContentType: mimeType,
  });

  await s3Client.send(command);

  // Return the public URL using R2 format
  return `${endpoint}/${bucketName}/${key}`;
}
export async function uploadProductImage(
  file: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  if (!bucketName) {
    throw new Error('S3_BUCKET_NAME is not defined');
  }

  // 統一輸出 webp，產生唯一檔名
  const ext = mimeType === 'image/webp' ? 'webp'
    : mimeType === 'image/png' ? 'png' : 'jpg';
  const key = `products/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file,
    ContentType: mimeType,
    // 設定公開讀取
    Metadata: {
      'uploaded-by': 'beauty-commerce',
    },
  });

  await s3Client.send(command);
  return `${endpoint}/${bucketName}/${key}`;
}

export async function uploadKolAvatar(
  file: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  if (!bucketName) {
    throw new Error('S3_BUCKET_NAME is not defined');
  }

  const ext = mimeType === 'image/webp' ? 'webp'
    : mimeType === 'image/png' ? 'png' : 'jpg';
  const key = `avatars/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file,
    ContentType: mimeType,
  });

  await s3Client.send(command);
  return `${endpoint}/${bucketName}/${key}`;
}

export { s3Client };
