import type { ComponentChildren } from 'preact';
import type { Product } from '../api';
import { categoryLabel, money } from '../lib';
import { addToCart } from '../cart';

const TINTS: Record<string, string> = {
    jabones: '#ebe1cc',
    shampoo: '#dde5d2',
    acondicionador: '#e9dcd2',
    cremas: '#f1e4d3',
    'cuidado-personal': '#e2e6d8',
    aceites: '#efe6c9',
    exfoliantes: '#e8dacb',
    baño: '#dfe6e3',
    facial: '#eedcd8',
    velas: '#f0e6d6',
};
const FALLBACK = ['#e6e0cf', '#dfe6d6', '#ecdfd3', '#e3e1d4'];

export function tint(category: string) {
    if (TINTS[category]) return TINTS[category];
    let h = 0;
    for (const ch of category) h = (h * 31 + ch.charCodeAt(0)) | 0;
    return FALLBACK[Math.abs(h) % FALLBACK.length];
}

export function ProductTile({
    product,
    large,
}: {
    product: Pick<Product, 'category'>;
    large?: boolean;
}) {
    return (
        <div
            class={`pimg pimg--ph${large ? ' pimg--lg' : ''}`}
            style={{ background: tint(product.category) }}
            aria-hidden="true"
        >
            <Leaf class="pimg__leaf" />
            <CategoryIcon category={product.category} />
        </div>
    );
}

const ICONS: Record<string, preact.JSX.Element> = {
    // pastilla de jabón con burbujas
    jabones: (
        <>
            <rect x="3" y="10" width="18" height="10" rx="3" />
            <path d="M7 14.5c1.5-1 3-1 4.5 0s3 1 4.5 0" />
            <circle cx="9" cy="5.5" r="1.8" />
            <circle cx="14.5" cy="4" r="1.2" />
        </>
    ),
    // botella
    shampoo: (
        <>
            <path d="M10 2h4v3h-4z" />
            <path d="M9 5h6l1.5 3v12a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2V8z" />
            <path d="M9 12h6v5H9z" />
        </>
    ),
    acondicionador: (
        <>
            <path d="M10.5 2h3v3h-3z" />
            <path d="M8 5h8v15a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2z" />
            <path d="M10 11c1.3 1 2.7 1 4 0" />
        </>
    ),
    // frasco de crema
    cremas: (
        <>
            <rect x="5" y="4" width="14" height="4" rx="1" />
            <path d="M6 8h12v10a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z" />
            <path d="M9 13.5h6" />
        </>
    ),
    // gota
    'cuidado-personal': (
        <>
            <path d="M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z" />
            <path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" />
        </>
    ),
    // frasco gotero
    aceites: (
        <>
            <path d="M11 2h2v3h-2z" />
            <path d="M10 5h4v3h-4z" />
            <path d="M9 8h6a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V9a1 1 0 0 1 1-1z" />
            <path d="M8 13h8" />
        </>
    ),
    // tarro abierto con granos
    exfoliantes: (
        <>
            <path d="M5 9h14v9a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z" />
            <path d="M4 9h16" />
            <circle cx="9" cy="5.5" r="1" />
            <circle cx="12.5" cy="4" r="1" />
            <circle cx="15" cy="6.5" r="1" />
        </>
    ),
    // tina
    baño: (
        <>
            <path d="M3 12h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5z" />
            <path d="M6 12V6a2 2 0 0 1 4 0" />
            <path d="M7 19l-1 2M17 19l1 2" />
        </>
    ),
    // flor
    facial: (
        <>
            <circle cx="12" cy="12" r="2.5" />
            <path d="M12 9.5C10 5 14 5 12 9.5zM14.5 12c4.5-2 4.5 2 0 0zM12 14.5c2 4.5-2 4.5 0 0zM9.5 12c-4.5 2-4.5-2 0 0z" />
        </>
    ),
    // vela
    velas: (
        <>
            <path d="M8 10h8v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1z" />
            <path d="M12 10V8" />
            <path d="M12 3c1.5 1.5 1.5 3 0 4.5-1.5-1.5-1.5-3 0-4.5z" />
        </>
    ),
};

export function CategoryIcon({ category }: { category: string }) {
    return (
        <svg
            class="pimg__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.3"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            {ICONS[category] ?? (
                <>
                    <path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z" />
                    <path d="M5 19l7-7" />
                </>
            )}
        </svg>
    );
}

export function ProductCard({ product }: { product: Product }) {
    const out = product.stock === 0;
    return (
        <article class="card">
            <a href={`#/producto/${product.id}`} class="card__link">
                <ProductTile product={product} />
                <div class="card__body">
                    <span class="eyebrow">{categoryLabel(product.category)}</span>
                    <h3 class="card__title">{product.name}</h3>
                    <p class="card__desc">{product.description}</p>
                </div>
            </a>
            <div class="card__foot">
                <span class="price">{money(product.price)}</span>
                {out ? (
                    <span class="badge badge--muted">Agotado</span>
                ) : (
                    <button class="btn btn--sm" onClick={() => addToCart(product)}>
                        Agregar
                    </button>
                )}
            </div>
        </article>
    );
}

export function Leaf(props: { class?: string }) {
    return (
        <svg
            class={props.class}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
        >
            <path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z" />
            <path d="M5 19l7-7" />
        </svg>
    );
}

export function QtyStepper({
    value,
    max,
    onChange,
}: {
    value: number;
    max: number;
    onChange: (n: number) => void;
}) {
    return (
        <div class="qty">
            <button
                type="button"
                aria-label="Quitar uno"
                disabled={value <= 1}
                onClick={() => onChange(value - 1)}
            >
                −
            </button>
            <span>{value}</span>
            <button
                type="button"
                aria-label="Agregar uno"
                disabled={value >= Math.min(max, 99)}
                onClick={() => onChange(value + 1)}
            >
                +
            </button>
        </div>
    );
}

export const Loading = () => (
    <div class="state">
        <span class="spinner" /> Cargando…
    </div>
);

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
        <div class="state state--error">
            <p>{message}</p>
            {onRetry && (
                <button class="btn btn--ghost btn--sm" onClick={onRetry}>
                    Reintentar
                </button>
            )}
        </div>
    );
}

export function Empty({ title, children }: { title: string; children?: ComponentChildren }) {
    return (
        <div class="empty">
            <Leaf class="empty__icon" />
            <h2>{title}</h2>
            {children}
        </div>
    );
}

export function Field({
    label,
    children,
    hint,
}: {
    label: string;
    children: ComponentChildren;
    hint?: string;
}) {
    return (
        <label class="field">
            <span class="field__label">{label}</span>
            {children}
            {hint && <span class="field__hint">{hint}</span>}
        </label>
    );
}
