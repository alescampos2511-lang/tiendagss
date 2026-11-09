import { signal } from '@preact/signals';

export type Product = {
    id: number;
    name: string;
    description: string;
    category: string;
    price: number; // centavos
    stock: number;
    active: boolean;
    created_at: string;
};

export type Category = { name: string; count: number };

export type OrderStatus = 'pendiente' | 'pagado' | 'enviado' | 'entregado' | 'cancelado';

export type Order = {
    id: string;
    customer_name: string;
    email: string;
    phone: string;
    address: string;
    notes: string;
    status: OrderStatus;
    total: number;
    created_at: string;
    items?: { product_id: number; product_name: string; unit_price: number; quantity: number }[];
};

export type NewOrder = {
    customer_name: string;
    email: string;
    phone: string;
    address: string;
    notes: string;
    items: { product_id: number; quantity: number }[];
};

export type ProductInput = Partial<Omit<Product, 'id' | 'created_at'>>;

/* ---------- Token admin ---------- */
const TOKEN_KEY = 'nutrista_admin_token';
const storage = {
    get: (k: string) => {
        try {
            return localStorage.getItem(k);
        } catch {
            return null;
        }
    },
    set: (k: string, v: string | null) => {
        try {
            v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v);
        } catch {
            /* sin storage */
        }
    },
};
export const adminToken = signal(storage.get(TOKEN_KEY) ?? '');
export function setAdminToken(t: string) {
    adminToken.value = t;
    storage.set(TOKEN_KEY, t || null);
}
export { storage };

/* ---------- Fetch ---------- */
export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

async function req<T>(
    path: string,
    opts: { method?: string; body?: unknown; admin?: boolean } = {}
): Promise<T> {
    const headers: Record<string, string> = {};
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
    if (opts.admin) headers.Authorization = `Bearer ${adminToken.value}`;

    let res: Response;
    try {
        res = await fetch('/api' + path, {
            method: opts.method ?? 'GET',
            headers,
            body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
        });
    } catch {
        throw new ApiError('No se pudo conectar con el servidor', 0);
    }

    if (res.status === 204) return undefined as T;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        if (opts.admin && res.status === 401) setAdminToken('');
        throw new ApiError(data.error ?? 'Ocurrió un error', res.status);
    }
    return data as T;
}

const qs = (params: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `?${s}` : '';
};

export const api = {
    products: (params: { category?: string; q?: string } = {}) =>
        req<Product[]>(`/products${qs(params)}`),
    product: (id: number) => req<Product>(`/products/${id}`),
    categories: () => req<Category[]>('/categories'),
    createOrder: (o: NewOrder) => req<Order>('/orders', { method: 'POST', body: o }),
    order: (id: string) => req<Order>(`/orders/${encodeURIComponent(id)}`),

    admin: {
        products: () => req<Product[]>('/admin/products', { admin: true }),
        createProduct: (p: ProductInput) =>
            req<Product>('/admin/products', { method: 'POST', body: p, admin: true }),
        updateProduct: (id: number, p: ProductInput) =>
            req<Product>(`/admin/products/${id}`, { method: 'PATCH', body: p, admin: true }),
        orders: (status?: string) =>
            req<Order[]>(`/admin/orders${qs({ status })}`, { admin: true }),
        order: (id: string) =>
            req<Order>(`/admin/orders/${encodeURIComponent(id)}`, { admin: true }),
        setOrderStatus: (id: string, status: OrderStatus) =>
            req<Order>(`/admin/orders/${encodeURIComponent(id)}`, {
                method: 'PATCH',
                body: { status },
                admin: true,
            }),
    },
};
