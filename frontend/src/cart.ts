import { computed, effect, signal } from '@preact/signals';
import { storage, type Product } from './api';

export type CartLine = {
    product_id: number;
    name: string;
    category: string;
    price: number;
    stock: number;
    quantity: number;
};

const KEY = 'nutrista_cart';

function load(): CartLine[] {
    try {
        const v = JSON.parse(storage.get(KEY) ?? '[]');
        return Array.isArray(v) ? v : [];
    } catch {
        return [];
    }
}

export const cart = signal<CartLine[]>(load());
effect(() => storage.set(KEY, JSON.stringify(cart.value)));

export const cartCount = computed(() => cart.value.reduce((n, l) => n + l.quantity, 0));
export const cartTotal = computed(() => cart.value.reduce((n, l) => n + l.quantity * l.price, 0));

const clamp = (q: number, max: number) => Math.max(1, Math.min(q, max, 99));

export function addToCart(p: Product, qty = 1) {
    const existing = cart.value.find((l) => l.product_id === p.id);
    if (existing) {
        cart.value = cart.value.map((l) =>
            l.product_id === p.id
                ? {
                      ...l,
                      price: p.price,
                      stock: p.stock,
                      quantity: clamp(l.quantity + qty, p.stock),
                  }
                : l
        );
    } else {
        cart.value = [
            ...cart.value,
            {
                product_id: p.id,
                name: p.name,
                category: p.category,
                price: p.price,
                stock: p.stock,
                quantity: clamp(qty, p.stock),
            },
        ];
    }
    toast(`${p.name} agregado al carrito`);
}

export function setQty(id: number, qty: number) {
    cart.value = cart.value.map((l) =>
        l.product_id === id ? { ...l, quantity: clamp(qty, l.stock) } : l
    );
}

export const removeFromCart = (id: number) =>
    (cart.value = cart.value.filter((l) => l.product_id !== id));
export const clearCart = () => (cart.value = []);

/* ---------- Toast ---------- */
export const toastMsg = signal<string | null>(null);
let timer: number | undefined;
export function toast(msg: string) {
    toastMsg.value = msg;
    clearTimeout(timer);
    timer = window.setTimeout(() => (toastMsg.value = null), 2500);
}
