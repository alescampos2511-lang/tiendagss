import { Hono } from 'hono';
import { db } from '../db.ts';
import { asBody, bad, idParam, int, str } from '../validate.ts';

export type Product = {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  active: boolean;
  created_at: string;
};

const toProduct = (r: any): Product => ({ ...r, active: r.active === 1 });

export function getProduct(id: number): Product | undefined {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  return row ? toProduct(row) : undefined;
}

/* ---------- Público ---------- */
export const publicProducts = new Hono();

// GET /api/products?category=jabones&q=lavanda
publicProducts.get('/products', (c) => {
  const { category, q } = c.req.query();
  let sql = 'SELECT * FROM products WHERE active = 1';
  const params: string[] = [];
  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (q) { sql += ' AND (name LIKE ? OR description LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY category, name';
  return c.json(db.prepare(sql).all(...params).map(toProduct));
});

publicProducts.get('/products/:id', (c) => {
  const p = getProduct(idParam(c.req.param('id')));
  if (!p || !p.active) throw bad('Producto no encontrado', 404);
  return c.json(p);
});

publicProducts.get('/categories', (c) => {
  const rows = db
    .prepare('SELECT category AS name, COUNT(*) AS count FROM products WHERE active = 1 GROUP BY category ORDER BY category')
    .all();
  return c.json(rows);
});

/* ---------- Admin ---------- */
export const adminProducts = new Hono();

adminProducts.get('/products', (c) => {
  return c.json(db.prepare('SELECT * FROM products ORDER BY id DESC').all().map(toProduct));
});

adminProducts.post('/products', async (c) => {
  const b = asBody(await c.req.json());
  const r = db
    .prepare(`INSERT INTO products (name, description, category, price, stock)
              VALUES (?, ?, ?, ?, ?)`)
    .run(
      str(b, 'name', { max: 120 })!,
      str(b, 'description', { optional: true, max: 2000 }) ?? '',
      str(b, 'category', { max: 60 })!.toLowerCase(),
      int(b, 'price', { min: 0 })!,
      int(b, 'stock', { optional: true, min: 0 }) ?? 0,
    );
  return c.json(getProduct(Number(r.lastInsertRowid)), 201);
});

// PATCH parcial: solo se actualizan los campos enviados
adminProducts.patch('/products/:id', async (c) => {
  const id = idParam(c.req.param('id'));
  const current = getProduct(id);
  if (!current) throw bad('Producto no encontrado', 404);
  const b = asBody(await c.req.json());

  const next = {
    name: str(b, 'name', { optional: true, max: 120 }) ?? current.name,
    description: str(b, 'description', { optional: true, max: 2000 }) ?? current.description,
    category: str(b, 'category', { optional: true, max: 60 })?.toLowerCase() ?? current.category,
    price: int(b, 'price', { optional: true, min: 0 }) ?? current.price,
    stock: int(b, 'stock', { optional: true, min: 0 }) ?? current.stock,
    active: typeof b.active === 'boolean' ? b.active : current.active,
  };

  db.prepare(`UPDATE products SET name=?, description=?, category=?, price=?, stock=?, active=?
              WHERE id=?`)
    .run(next.name, next.description, next.category, next.price, next.stock, next.active ? 1 : 0, id);
  return c.json(getProduct(id));
});

// "Borrado" suave: se desactiva para no romper pedidos antiguos
adminProducts.delete('/products/:id', (c) => {
  const id = idParam(c.req.param('id'));
  const r = db.prepare('UPDATE products SET active = 0 WHERE id = ?').run(id);
  if (r.changes === 0) throw bad('Producto no encontrado', 404);
  return c.body(null, 204);
});
