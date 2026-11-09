import { Hono } from 'hono';
import { randomUUID } from 'node:crypto';
import { db, tx } from '../db.ts';
import { asBody, bad, str } from '../validate.ts';

const STATUSES = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'] as const;
type Status = (typeof STATUSES)[number];

function getOrder(id: string) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return undefined;
  const items = db
    .prepare('SELECT product_id, product_name, unit_price, quantity FROM order_items WHERE order_id = ?')
    .all(id);
  return { ...order, items };
}

/* ---------- Público ---------- */
export const publicOrders = new Hono();

/**
 * POST /api/orders
 * { customer_name, email, phone?, address, notes?, items: [{ product_id, quantity }] }
 */
publicOrders.post('/orders', async (c) => {
  const b = asBody(await c.req.json());
  const customer = {
    name: str(b, 'customer_name', { max: 120 })!,
    email: str(b, 'email', { max: 200 })!,
    phone: str(b, 'phone', { optional: true, max: 30 }) ?? '',
    address: str(b, 'address', { max: 500 })!,
    notes: str(b, 'notes', { optional: true, max: 1000 }) ?? '',
  };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) throw bad('Email inválido');

  if (!Array.isArray(b.items) || b.items.length === 0) throw bad('El pedido no tiene productos');
  if (b.items.length > 50) throw bad('Demasiados productos en un pedido');

  // Agrupa cantidades por producto (por si llega el mismo producto dos veces)
  const wanted = new Map<number, number>();
  for (const it of b.items) {
    const pid = it?.product_id, qty = it?.quantity;
    if (!Number.isInteger(pid) || !Number.isInteger(qty) || qty < 1 || qty > 99) {
      throw bad('Cada item necesita product_id y quantity (1-99) enteros');
    }
    wanted.set(pid, (wanted.get(pid) ?? 0) + qty);
  }

  const id = randomUUID();
  tx(() => {
    const lines: { pid: number; name: string; price: number; qty: number }[] = [];
    for (const [pid, qty] of wanted) {
      const p = db.prepare('SELECT name, price, stock, active FROM products WHERE id = ?').get(pid) as
        | { name: string; price: number; stock: number; active: number }
        | undefined;
      if (!p || !p.active) throw bad(`Producto ${pid} no disponible`, 404);
      if (p.stock < qty) throw bad(`Stock insuficiente de "${p.name}" (quedan ${p.stock})`, 409);
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(qty, pid);
      lines.push({ pid, name: p.name, price: p.price, qty });
    }

    const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
    db.prepare(`INSERT INTO orders (id, customer_name, email, phone, address, notes, total)
                VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(id, customer.name, customer.email, customer.phone, customer.address, customer.notes, total);

    const ins = db.prepare(`INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
                            VALUES (?, ?, ?, ?, ?)`);
    for (const l of lines) ins.run(id, l.pid, l.name, l.price, l.qty);
  });

  return c.json(getOrder(id), 201);
});

// El ID es un UUID, así que funciona como "código de seguimiento"
publicOrders.get('/orders/:id', (c) => {
  const order = getOrder(c.req.param('id'));
  if (!order) throw bad('Pedido no encontrado', 404);
  return c.json(order);
});

/* ---------- Admin ---------- */
export const adminOrders = new Hono();

adminOrders.get('/orders', (c) => {
  const { status } = c.req.query();
  const rows = status
    ? db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC').all(status)
    : db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  return c.json(rows);
});

adminOrders.get('/orders/:id', (c) => {
  const order = getOrder(c.req.param('id'));
  if (!order) throw bad('Pedido no encontrado', 404);
  return c.json(order);
});

// PATCH /api/admin/orders/:id  { status }
adminOrders.patch('/orders/:id', async (c) => {
  const id = c.req.param('id');
  const status = str(asBody(await c.req.json()), 'status') as Status;
  if (!STATUSES.includes(status)) throw bad(`Estado inválido. Usa: ${STATUSES.join(', ')}`);

  tx(() => {
    const order = db.prepare('SELECT status FROM orders WHERE id = ?').get(id) as { status: Status } | undefined;
    if (!order) throw bad('Pedido no encontrado', 404);
    if (order.status === 'cancelado') throw bad('Un pedido cancelado no se puede modificar', 409);

    // Al cancelar se devuelve el stock
    if (status === 'cancelado') {
      db.prepare(`UPDATE products SET stock = stock + oi.quantity
                  FROM order_items oi WHERE oi.order_id = ? AND oi.product_id = products.id`).run(id);
    }
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
  });

  return c.json(getOrder(id));
});
