# Nutrista – Backend

Node 26 (TypeScript nativo, sin compilar) + Hono + SQLite (`node:sqlite`).

```bash
npm install
cp .env.example .env   # cambia ADMIN_TOKEN
npm run seed           # productos de ejemplo
npm run dev            # http://localhost:3000
```

Precios en **centavos** (6500 = $65.00).

## Público
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/products?category=&q=` | Catálogo (filtro por categoría / búsqueda) |
| GET | `/api/products/:id` | Detalle |
| GET | `/api/categories` | Categorías con conteo |
| POST | `/api/orders` | Crear pedido |
| GET | `/api/orders/:id` | Ver pedido (el UUID sirve de código de seguimiento) |

```json
POST /api/orders
{ "customer_name": "Ana", "email": "ana@mail.com", "phone": "", "address": "Calle 1",
  "notes": "", "items": [{ "product_id": 1, "quantity": 2 }] }
```

## Admin (`Authorization: Bearer <ADMIN_TOKEN>`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/admin/products` | Todos (incluye inactivos) |
| POST | `/api/admin/products` | Crear `{name, category, price, stock?, description?}` |
| PATCH | `/api/admin/products/:id` | Editar parcial (incluye `active`) |
| DELETE | `/api/admin/products/:id` | Desactivar |
| GET | `/api/admin/orders?status=` | Listar pedidos |
| GET | `/api/admin/orders/:id` | Detalle |
| PATCH | `/api/admin/orders/:id` | `{status}`: pendiente · pagado · enviado · entregado · cancelado |

Al crear un pedido se descuenta stock dentro de una transacción. Al cancelarlo, el stock se devuelve.
