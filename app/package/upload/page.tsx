'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Presigned = {
  originalName: string;
  contentType: string;
  bucket: string;
  key: string;
  url: string;
};

export default function UploadPage() {
  const router = useRouter();

  const [selected, setSelected] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});

  const totalSize = useMemo(() => selected.reduce((s, f) => s + f.size, 0), [selected]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setSelected(Array.from(e.target.files));
    setErr(null);
    setProgress({});
  };

  async function startUploadAndGoNext() {
    if (selected.length === 0) {
      setErr('파일을 선택해 주세요.');
      return;
    }

    try {
      setUploading(true);
      setErr(null);

      // 1) presign
      const res = await fetch('/api/s3/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: selected.map((f) => ({ name: f.name, type: f.type })),
        }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(`presign failed: ${res.status} ${t}`);
      }

      const { presigned } = (await res.json()) as { presigned: Presigned[] };

      // 2) PUT to S3
      await Promise.all(
        presigned.map((p, idx) => {
          const file = selected[idx];

          return new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', p.url);

            // Content-Type은 presign과 동일해야 안전
            xhr.setRequestHeader('Content-Type', p.contentType || 'application/octet-stream');

            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                setProgress((prev) => ({
                  ...prev,
                  [p.key]: Math.round((e.loaded / e.total) * 100),
                }));
              }
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) resolve();
              else reject(new Error(`S3 PUT failed: ${xhr.status} ${xhr.responseText}`));
            };
            xhr.onerror = () => reject(new Error('S3 PUT network error'));
            xhr.send(file);
          });
        })
      );

      // 3) 결과 저장 (review에서 사용)
      const uploaded = presigned.map((p) => ({
        bucket: p.bucket,
        key: p.key,
        originalName: p.originalName,
        contentType: p.contentType,
        size: selected.find((f) => f.name === p.originalName)?.size ?? null,
      }));

      sessionStorage.setItem('uploadedFiles', JSON.stringify(uploaded));

      // 4) 다음 단계
      router.push('/package/review');
    } catch (e: any) {
      console.error(e);
      setErr(e?.message ?? '업로드 실패');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 20 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>파일 업로드 (S3)</h1>
      <p style={{ marginTop: 8, opacity: 0.8 }}>PDF/AI/EPS/SVG/PNG/JPG 업로드</p>

      <div style={{ marginTop: 20, padding: 20, border: '1px dashed #999', borderRadius: 12 }}>
        <input type="file" multiple onChange={onPick} />
        <div style={{ marginTop: 10, opacity: 0.8 }}>
          선택됨: {selected.length}개 / {(totalSize / (1024 * 1024)).toFixed(1)} MB
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        {selected.map((f) => (
          <div key={f.name} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
            <div style={{ fontWeight: 600 }}>{f.name}</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              {(f.size / (1024 * 1024)).toFixed(1)} MB
            </div>
          </div>
        ))}
      </div>

      {Object.keys(progress).length > 0 && (
        <div style={{ marginTop: 16, fontSize: 12 }}>
          {Object.entries(progress).map(([k, v]) => (
            <div key={k}>
              {k.split('/').pop()} : {v}%
            </div>
          ))}
        </div>
      )}

      {err && <div style={{ marginTop: 16, color: 'crimson' }}>{err}</div>}

      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <button
          onClick={() => router.push('/package/configure')}
          style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #ccc' }}
          disabled={uploading}
        >
          이전
        </button>

        <button
          onClick={startUploadAndGoNext}
          style={{
            padding: '10px 16px',
            borderRadius: 10,
            border: '1px solid #111',
            background: '#111',
            color: '#fff',
          }}
          disabled={uploading || selected.length === 0}
        >
          {uploading ? '업로드 중...' : '업로드 후 최종 확인으로'}
        </button>
      </div>
    </div>
  );
}
