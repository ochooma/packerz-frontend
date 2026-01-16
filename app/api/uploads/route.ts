import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function POST(req: Request) {
  const form = await req.formData();
  const files = form.getAll('files') as File[];

  await fs.mkdir(path.join(process.cwd(), '.local', 'uploads'), { recursive: true });

  const saved: Array<{ originalName: string; storedName: string; size: number; mime: string }> = [];

  for (const f of files) {
    const buf = Buffer.from(await f.arrayBuffer());
    const storedName = `${Date.now()}_${Math.random().toString(16).slice(2)}_${safeName(f.name)}`;
    await fs.writeFile(path.join(process.cwd(), '.local', 'uploads', storedName), buf);

    saved.push({ originalName: f.name, storedName, size: f.size, mime: f.type || 'application/octet-stream' });
  }

  return NextResponse.json({ files: saved });
}