import { HTTPException } from 'hono/http-exception';

export const bad = (msg: string, status: 400 | 404 | 409 = 400) =>
  new HTTPException(status, { message: msg });

type Body = Record<string, unknown>;

export function asBody(v: unknown): Body {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw bad('El cuerpo debe ser un objeto JSON');
  return v as Body;
}

export function str(b: Body, key: string, opts: { optional?: boolean; max?: number } = {}): string | undefined {
  const v = b[key];
  if (v === undefined || v === null || v === '') {
    if (opts.optional) return undefined;
    throw bad(`"${key}" es obligatorio`);
  }
  if (typeof v !== 'string') throw bad(`"${key}" debe ser texto`);
  const s = v.trim();
  if (s.length > (opts.max ?? 500)) throw bad(`"${key}" es demasiado largo`);
  return s;
}

export function int(b: Body, key: string, opts: { optional?: boolean; min?: number; max?: number } = {}): number | undefined {
  const v = b[key];
  if (v === undefined || v === null) {
    if (opts.optional) return undefined;
    throw bad(`"${key}" es obligatorio`);
  }
  if (typeof v !== 'number' || !Number.isInteger(v)) throw bad(`"${key}" debe ser un número entero`);
  if (opts.min !== undefined && v < opts.min) throw bad(`"${key}" debe ser >= ${opts.min}`);
  if (opts.max !== undefined && v > opts.max) throw bad(`"${key}" debe ser <= ${opts.max}`);
  return v;
}

export function idParam(raw: string): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) throw bad('ID inválido');
  return n;
}
