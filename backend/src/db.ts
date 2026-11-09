import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const path = process.env.DB_PATH ?? 'data/tienda.db';
mkdirSync(dirname(path), { recursive: true });

export const db = new DatabaseSync(path);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    description TEXT    NOT NULL DEFAULT '',
    category    TEXT    NOT NULL,
    price       INTEGER NOT NULL CHECK (price >= 0),   -- en centavos
    stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    active      INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id            TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    email         TEXT NOT NULL,
    phone         TEXT NOT NULL DEFAULT '',
    address       TEXT NOT NULL,
    notes         TEXT NOT NULL DEFAULT '',
    status        TEXT NOT NULL DEFAULT 'pendiente'
                  CHECK (status IN ('pendiente','pagado','enviado','entregado','cancelado')),
    total         INTEGER NOT NULL,
    created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id     TEXT    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id   INTEGER NOT NULL REFERENCES products(id),
    product_name TEXT    NOT NULL,
    unit_price   INTEGER NOT NULL,
    quantity     INTEGER NOT NULL CHECK (quantity > 0)
  );

  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
  CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
`);

/** Ejecuta fn dentro de una transacción; hace ROLLBACK si lanza error. */
export function tx<T>(fn: () => T): T {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
