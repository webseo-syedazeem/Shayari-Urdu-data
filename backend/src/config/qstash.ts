import { Client } from '@upstash/qstash';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const token = process.env.QSTASH_TOKEN?.trim();

export const qstash = token ? new Client({ token }) : null;

export function persistCallbackUrl(): string {
  const base = process.env.BACKEND_PUBLIC_URL?.trim();
  if (!base) throw new Error('BACKEND_PUBLIC_URL is not set - required for QStash callbacks');
  return `${base.replace(/\/$/, '')}/api/internal/persist`;
}