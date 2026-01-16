import { NextResponse } from 'next/server';
import { presignPut } from '@/lib/server/s3Presign';

export async function POST(req: Request) {
  const body = await req.json();
  const files = (body.files ?? []) as Array<{ name: string; type: string }>;

  const now = new Date();
  const prefix = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;

  const presigned = await Promise.all(
    files.map(async (f) => {
      const safe = f.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const key = `uploads/original/${prefix}/${Date.now()}_${Math.random().toString(16).slice(2)}_${safe}`;
      return {
        originalName: f.name,
        contentType: f.type || 'application/octet-stream',
        ...(await presignPut({ key, contentType: f.type || 'application/octet-stream' })),
      };
    })
  );

  return NextResponse.json({ presigned });
}