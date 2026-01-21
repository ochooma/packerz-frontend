import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body?.buyer?.name || !body?.buyer?.phone || !body?.buyer?.email) {
      return NextResponse.json({ error: "buyer info missing" }, { status: 400 });
    }

    const id = `PZ-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomUUID().slice(0, 8)}`;

    const record = {
      id,
      createdAt: new Date().toISOString(),
      status: "draft",
      buyer: body.buyer,
      tax: body.tax ?? null,
    };

    const dir = path.join(process.cwd(), ".data");
    const file = path.join(dir, "orders.jsonl");

    await fs.mkdir(dir, { recursive: true });
    await fs.appendFile(file, JSON.stringify(record) + "\n", "utf-8");

    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
}