import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const region = process.env.AWS_REGION!;
const bucket = process.env.S3_BUCKET!;

const s3 = new S3Client({ region });

export async function presignPut(params: { key: string; contentType: string }) {
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: params.key,
    ContentType: params.contentType,
  });

  const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 }); // 5분
  return { url, bucket, key: params.key };
}