import { NextResponse } from 'next/server';
import { createOrder, listOrders } from '@/lib/server/orderStore';

export async function GET() {
  return NextResponse.json({ orders: await listOrders() });
}

export async function POST(req: Request) {
  const body = await req.json();
  const order = await createOrder({
    sku: body.sku ?? null,
    config: body.config ?? {},
    notes: body.notes ?? '',
    estimate: body.estimate ?? null,
    files: body.files ?? [],
  });
  return NextResponse.json({ order });
}