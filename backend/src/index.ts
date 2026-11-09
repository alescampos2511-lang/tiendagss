import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { existsSync } from 'node:fs';
import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import { adminOrders, publicOrders } from './routes/orders.ts';
import { adminProducts, publicProducts } from './routes/products.ts';

const PORT = Number(process.env.PORT ?? 3000);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
if (!ADMIN_TOKEN) console.warn('⚠  ADMIN_TOKEN no definido: las rutas /api/admin quedan bloqueadas');

const app = new Hono();
app.use(logger());
app.use('/api/*', cors({ origin: process.env.CORS_ORIGIN ?? '*' }));

app.get('/api/health', (c) => c.json({ ok: true }));

// Público
app.route('/api', publicProducts);
app.route('/api', publicOrders);

// Admin (Authorization: Bearer <ADMIN_TOKEN>)
const admin = new Hono();
admin.use(async (c, next) => {
  if (!ADMIN_TOKEN) return c.json({ error: 'Admin deshabilitado' }, 503);
  return bearerAuth({ token: ADMIN_TOKEN })(c, next);
});
admin.route('/', adminProducts);
admin.route('/', adminOrders);
app.route('/api/admin', admin);

// En producción sirve el frontend compilado (npm run build en /frontend)
const STATIC_DIR = process.env.STATIC_DIR ?? '../frontend/dist';
if (existsSync(STATIC_DIR)) app.use('/*', serveStatic({ root: STATIC_DIR }));

app.notFound((c) => c.json({ error: 'Ruta no encontrada' }, 404));
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    if (err.status === 401) return c.json({ error: 'No autorizado' }, 401);
    return c.json({ error: err.message }, err.status);
  }
  if (err instanceof SyntaxError) return c.json({ error: 'JSON inválido' }, 400);
  console.error(err);
  return c.json({ error: 'Error interno' }, 500);
});

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`🌿 API escuchando en http://localhost:${info.port}`);
});
