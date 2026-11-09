# syntax=docker/dockerfile:1

# ---------- 1. Compilar el frontend ----------
FROM node:26-alpine AS frontend
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---------- 2. Dependencias de producción del backend ----------
FROM node:26-alpine AS deps
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

# ---------- 3. Imagen final ----------
FROM node:26-alpine
ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/app/data/tienda.db \
    STATIC_DIR=public
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY backend/package.json ./
COPY backend/src ./src
COPY --from=frontend /build/dist ./public

RUN mkdir -p data && chown node:node data
USER node

EXPOSE 3000
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Siembra productos de ejemplo solo si la base está vacía y arranca el servidor
CMD ["sh", "-c", "node src/seed.ts --if-empty && exec node src/index.ts"]
