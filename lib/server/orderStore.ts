import { promises as fs } from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), '.local', 'orders.json');

export type OrderRecord = {
  id: string;
  createdAt: string;
  status: 'RECEIVED' | 'REVIEWING' | 'PROOF' | 'PAY_WAIT' | 'IN_PROD' | 'SHIPPED';
  sku: string | null;
  config: any;
  notes?: string;
  estimate?: any;
  files: Array<{ originalName: string; storedName: string; size: number; mime: string }>;
  finalPrice?: number | null;
};

async function readAll(): Promise<OrderRecord[]> {
  try { return JSON.parse(await fs.readFile(DB_PATH, 'utf-8')) as OrderRecord[]; } catch { return []; }
}
async function writeAll(rows: OrderRecord[]) {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(rows, null, 2), 'utf-8');
}

export async function createOrder(row: Omit<OrderRecord, 'id' | 'createdAt' | 'status'>) {
  const all = await readAll();
  const id = `PKG-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const record: OrderRecord = { id, createdAt: new Date().toISOString(), status: 'RECEIVED', ...row, finalPrice: null };
  all.unshift(record);
  await writeAll(all);
  return record;
}

export async function listOrders() {
  return readAll();
}