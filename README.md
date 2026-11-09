# Nutrista

Tienda de cosmética natural hecha en casa.

- `backend/`: Node 26 + Hono + SQLite ([ver endpoints](backend/README.md))
- `frontend/`: Vite + Preact + TypeScript

## Desarrollo (dos terminales)

```bash
cd backend && npm install && cp .env.example .env && npm run seed && npm run dev   # :3000
cd frontend && npm install && npm run dev                                           # :5173
```

Abre http://localhost:5173. Vite redirige `/api` al backend.
Panel de administración: http://localhost:5173/#/admin (usa el `ADMIN_TOKEN` del `.env`).

## Docker (producción)

Una sola imagen con todo: el frontend compilado lo sirve el mismo backend en el puerto 3000.
La base SQLite vive en el volumen `nutrista-data`, así que los datos sobreviven a reinicios y actualizaciones.

```bash
cp .env.example .env     # define ADMIN_TOKEN (obligatorio)
docker compose up -d --build
```

- Tienda: http://localhost:3000
- Admin: http://localhost:3000/#/admin (con el `ADMIN_TOKEN` del `.env` de la raíz)
- La primera vez carga los productos de ejemplo; después ya no los vuelve a insertar.

| Acción | Comando |
|---|---|
| Ver logs | `docker compose logs -f` |
| Actualizar tras cambios | `docker compose up -d --build` |
| Detener | `docker compose down` |
| Borrar todo, datos incluidos | `docker compose down -v` |

Para usar otro puerto, cambia `PORT` en `.env`.

**Respaldo de la base** (copia consistente aunque el contenedor esté corriendo):

```bash
docker compose exec nutrista node -e "new (require('node:sqlite').DatabaseSync)('data/tienda.db').exec(\"VACUUM INTO 'data/respaldo.db'\")"
docker compose cp nutrista:/app/data/respaldo.db ./respaldo.db
docker compose exec nutrista rm data/respaldo.db
```
