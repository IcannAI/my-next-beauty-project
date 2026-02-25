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

export { s3Client };
