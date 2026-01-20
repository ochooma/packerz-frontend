// app/api/orders/draft/route.ts
import { NextResponse } from "next/server";

type DraftPayload = any; // 지금은 유연하게. 나중에 타입 엄격하게 바꿔도 됨.

type Store = Map<string, { createdAt: number; payload: DraftPayload }>;

function getStore(): Store {
  // dev 서버에서 핫리로드 되어도 유지되도록 globalThis 사용
  const g = globalThis as any;
  if (!g.__PACKERZ_DRAFT_STORE__) g.__PACKERZ_DRAFT_STORE__ = new Map();
  return g.__PACKERZ_DRAFT_STORE__ as Store;
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as DraftPayload;

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const store = getStore();
    store.set(id, { createdAt: Date.now(), payload });

    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message ?? "Invalid JSON" },
      { status: 400 }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, message: "Missing id" }, { status: 400 });
  }

  const store = getStore();
  const v = store.get(id);
  if (!v) {
    return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, id, ...v });
}
