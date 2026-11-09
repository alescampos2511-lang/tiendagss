import { Fragment } from 'preact';
import { useState } from 'preact/hooks';
import { adminToken, api, setAdminToken, type Order, type OrderStatus, type Product } from '../api';
import { toast } from '../cart';
import { STATUS_LABEL, categoryLabel, date, money, useAsync } from '../lib';
import { ErrorBox, Field, Loading } from '../components/ui';

export function Admin() {
    const [tab, setTab] = useState<'pedidos' | 'productos'>('pedidos');
    if (!adminToken.value) return <Login />;

    return (
        <div class="container page">
            <div class="admin__head">
                <h1 class="page__title">Administración</h1>
                <button class="btn btn--ghost btn--sm" onClick={() => setAdminToken('')}>
                    Cerrar sesión
                </button>
            </div>
            <div class="tabs">
                <button
                    class={tab === 'pedidos' ? 'is-active' : ''}
                    onClick={() => setTab('pedidos')}
                >
                    Pedidos
                </button>
                <button
                    class={tab === 'productos' ? 'is-active' : ''}
                    onClick={() => setTab('productos')}
                >
                    Productos
                </button>
            </div>
            {tab === 'pedidos' ? <Orders /> : <Products />}
        </div>
    );
}

function Login() {
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    async function submit(e: Event) {
        e.preventDefault();
        setBusy(true);
        setError('');
        setAdminToken(token.trim());
        try {
            await api.admin.orders(); // verifica el token
        } catch (err) {
            setAdminToken('');
            setError((err as Error).message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div class="container page page--narrow">
            <form class="panel form login" onSubmit={submit}>
                <h1>Acceso administrador</h1>
                <Field label="Token de acceso">
                    <input
                        class="input"
                        type="password"
                        required
                        value={token}
                        onInput={(e) => setToken(e.currentTarget.value)}
                    />
                </Field>
                {error && <p class="alert">{error}</p>}
                <button class="btn btn--block" disabled={busy}>
                    {busy ? 'Verificando…' : 'Entrar'}
                </button>
            </form>
        </div>
    );
}

/* ---------------- Pedidos ---------------- */

const STATUSES = Object.keys(STATUS_LABEL) as OrderStatus[];

function Orders() {
    const [filter, setFilter] = useState('');
    const [open, setOpen] = useState<string | null>(null);
    const orders = useAsync(() => api.admin.orders(filter || undefined), [filter]);

    async function changeStatus(o: Order, status: OrderStatus) {
        if (
            status === 'cancelado' &&
            !confirm('¿Cancelar este pedido? El stock se devolverá y no se podrá revertir.')
        )
            return;
        try {
            await api.admin.setOrderStatus(o.id, status);
            toast(`Pedido marcado como ${STATUS_LABEL[status].toLowerCase()}`);
            orders.reload();
        } catch (err) {
            toast((err as Error).message);
        }
    }

    return (
        <section class="panel panel--flush">
            <div class="panel__bar">
                <select
                    class="input input--sm"
                    value={filter}
                    onChange={(e) => setFilter(e.currentTarget.value)}
                >
                    <option value="">Todos los estados</option>
                    {STATUSES.map((s) => (
                        <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                        </option>
                    ))}
                </select>
                <span class="muted small">{orders.data?.length ?? 0} pedidos</span>
            </div>

            {orders.error ? (
                <ErrorBox message={orders.error} onRetry={orders.reload} />
            ) : orders.loading && !orders.data ? (
                <Loading />
            ) : orders.data!.length === 0 ? (
                <p class="state">No hay pedidos.</p>
            ) : (
                <div class="table-wrap">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Pedido</th>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th class="num">Total</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.data!.map((o) => (
                                <Fragment key={o.id}>
                                    <tr
                                        class="is-clickable"
                                        onClick={() => setOpen(open === o.id ? null : o.id)}
                                    >
                                        <td class="mono">#{o.id.slice(0, 8).toUpperCase()}</td>
                                        <td>{date(o.created_at)}</td>
                                        <td>
                                            {o.customer_name}
                                            <br />
                                            <span class="muted small">{o.email}</span>
                                        </td>
                                        <td class="num">{money(o.total)}</td>
                                        <td onClick={(e) => e.stopPropagation()}>
                                            <select
                                                class={`input input--sm status status--${o.status}`}
                                                value={o.status}
                                                disabled={o.status === 'cancelado'}
                                                onChange={(e) =>
                                                    changeStatus(
                                                        o,
                                                        e.currentTarget.value as OrderStatus
                                                    )
                                                }
                                            >
                                                {STATUSES.map((s) => (
                                                    <option key={s} value={s}>
                                                        {STATUS_LABEL[s]}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                    {open === o.id && (
                                        <tr class="table__detail">
                                            <td colSpan={5}>
                                                <OrderDetail id={o.id} />
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

function OrderDetail({ id }: { id: string }) {
    const { data: o, loading, error } = useAsync(() => api.admin.order(id), [id]);
    if (loading) return <Loading />;
    if (error || !o) return <p class="alert">{error}</p>;
    return (
        <div class="odetail">
            <div>
                <span class="eyebrow">Productos</span>
                <ul class="items">
                    {o.items?.map((it) => (
                        <li key={it.product_id}>
                            <span>
                                {it.quantity} × {it.product_name}
                            </span>
                            <span>{money(it.unit_price * it.quantity)}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div>
                <span class="eyebrow">Entrega</span>
                <p>{o.address}</p>
                {o.phone && <p>Tel: {o.phone}</p>}
                {o.notes && <p class="muted">Notas: {o.notes}</p>}
                <a class="small" href={`#/pedido/${o.id}`} target="_blank">
                    Ver página del cliente ↗
                </a>
            </div>
        </div>
    );
}

/* ---------------- Productos ---------------- */

function Products() {
    const products = useAsync(() => api.admin.products(), []);
    const [editing, setEditing] = useState<Product | 'new' | null>(null);
    const categories = [...new Set(products.data?.map((p) => p.category) ?? [])];

    return (
        <>
            {editing && (
                <ProductForm
                    product={editing === 'new' ? null : editing}
                    categories={categories}
                    onClose={() => setEditing(null)}
                    onSaved={() => {
                        setEditing(null);
                        products.reload();
                    }}
                />
            )}
            <section class="panel panel--flush">
                <div class="panel__bar">
                    <span class="muted small">{products.data?.length ?? 0} productos</span>
                    <button class="btn btn--sm" onClick={() => setEditing('new')}>
                        + Nuevo producto
                    </button>
                </div>
                {products.error ? (
                    <ErrorBox message={products.error} onRetry={products.reload} />
                ) : products.loading && !products.data ? (
                    <Loading />
                ) : (
                    <div class="table-wrap">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Categoría</th>
                                    <th class="num">Precio</th>
                                    <th class="num">Stock</th>
                                    <th>Estado</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.data!.map((p) => (
                                    <tr key={p.id} class={p.active ? '' : 'is-off'}>
                                        <td>{p.name}</td>
                                        <td>{categoryLabel(p.category)}</td>
                                        <td class="num">{money(p.price)}</td>
                                        <td class={`num${p.stock <= 5 ? ' warn' : ''}`}>
                                            {p.stock}
                                        </td>
                                        <td>
                                            <span
                                                class={`badge ${p.active ? 'badge--entregado' : 'badge--muted'}`}
                                            >
                                                {p.active ? 'Activo' : 'Oculto'}
                                            </span>
                                        </td>
                                        <td class="num">
                                            <button
                                                class="btn btn--ghost btn--sm"
                                                onClick={() => setEditing(p)}
                                            >
                                                Editar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </>
    );
}

function ProductForm({
    product,
    categories,
    onClose,
    onSaved,
}: {
    product: Product | null;
    categories: string[];
    onClose: () => void;
    onSaved: () => void;
}) {
    const [f, setF] = useState({
        name: product?.name ?? '',
        category: product?.category ?? '',
        price: product ? (product.price / 100).toFixed(2) : '',
        stock: String(product?.stock ?? 0),
        description: product?.description ?? '',
        active: product?.active ?? true,
    });
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const set = (k: keyof typeof f) => (e: Event) =>
        setF({ ...f, [k]: (e.currentTarget as HTMLInputElement).value });

    async function submit(e: Event) {
        e.preventDefault();
        setBusy(true);
        setError('');
        const body = {
            name: f.name,
            category: f.category,
            price: Math.round(parseFloat(f.price) * 100),
            stock: parseInt(f.stock, 10),
            description: f.description,
            active: f.active,
        };
        try {
            if (product) await api.admin.updateProduct(product.id, body);
            else await api.admin.createProduct(body);
            toast(product ? 'Producto actualizado' : 'Producto creado');
            onSaved();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div class="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <form class="panel form modal__box" onSubmit={submit}>
                <h2>{product ? 'Editar producto' : 'Nuevo producto'}</h2>
                <Field label="Nombre">
                    <input
                        class="input"
                        required
                        maxLength={120}
                        value={f.name}
                        onInput={set('name')}
                    />
                </Field>
                <div class="form__row">
                    <Field label="Categoría">
                        <input
                            class="input"
                            required
                            list="cats"
                            maxLength={60}
                            value={f.category}
                            onInput={set('category')}
                        />
                        <datalist id="cats">
                            {categories.map((c) => (
                                <option key={c} value={c} />
                            ))}
                        </datalist>
                    </Field>
                    <Field label="Precio (MXN)">
                        <input
                            class="input"
                            required
                            type="number"
                            min="0"
                            step="0.01"
                            value={f.price}
                            onInput={set('price')}
                        />
                    </Field>
                    <Field label="Stock">
                        <input
                            class="input"
                            required
                            type="number"
                            min="0"
                            step="1"
                            value={f.stock}
                            onInput={set('stock')}
                        />
                    </Field>
                </div>
                <Field label="Descripción">
                    <textarea
                        class="input"
                        rows={3}
                        maxLength={2000}
                        value={f.description}
                        onInput={set('description')}
                    />
                </Field>
                <label class="check">
                    <input
                        type="checkbox"
                        checked={f.active}
                        onChange={(e) => setF({ ...f, active: e.currentTarget.checked })}
                    />
                    Visible en la tienda
                </label>
                {error && <p class="alert">{error}</p>}
                <div class="form__actions">
                    <button type="button" class="btn btn--ghost" onClick={onClose}>
                        Cancelar
                    </button>
                    <button class="btn" disabled={busy}>
                        {busy ? 'Guardando…' : 'Guardar'}
                    </button>
                </div>
            </form>
        </div>
    );
}
