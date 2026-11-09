import { useState } from 'preact/hooks';
import { api } from '../api';
import { cart, cartTotal, clearCart, removeFromCart, setQty } from '../cart';
import { navigate } from '../router';
import { money } from '../lib';
import { Empty, Field, ProductTile, QtyStepper } from '../components/ui';

export function Cart() {
    const lines = cart.value;
    const [form, setForm] = useState({
        customer_name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
    });
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    if (lines.length === 0) {
        return (
            <div class="container page">
                <Empty title="Tu carrito está vacío">
                    <p>Descubre nuestros productos hechos a mano.</p>
                    <a href="#/tienda" class="btn">
                        Ir a la tienda
                    </a>
                </Empty>
            </div>
        );
    }

    const set = (k: keyof typeof form) => (e: Event) =>
        setForm({ ...form, [k]: (e.currentTarget as HTMLInputElement).value });

    async function submit(e: Event) {
        e.preventDefault();
        setSending(true);
        setError('');
        try {
            const order = await api.createOrder({
                ...form,
                items: lines.map((l) => ({ product_id: l.product_id, quantity: l.quantity })),
            });
            clearCart();
            navigate(`/pedido/${order.id}/gracias`);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSending(false);
        }
    }

    return (
        <div class="container page">
            <h1 class="page__title">Tu carrito</h1>
            <div class="checkout">
                <section class="panel">
                    <ul class="lines">
                        {lines.map((l) => (
                            <li key={l.product_id} class="line">
                                <a href={`#/producto/${l.product_id}`} class="line__img">
                                    <ProductTile product={l} />
                                </a>
                                <div class="line__info">
                                    <a href={`#/producto/${l.product_id}`} class="line__name">
                                        {l.name}
                                    </a>
                                    <span class="muted">{money(l.price)} c/u</span>
                                </div>
                                <QtyStepper
                                    value={l.quantity}
                                    max={l.stock}
                                    onChange={(n) => setQty(l.product_id, n)}
                                />
                                <span class="line__total">{money(l.price * l.quantity)}</span>
                                <button
                                    class="icon-btn"
                                    aria-label={`Quitar ${l.name}`}
                                    onClick={() => removeFromCart(l.product_id)}
                                >
                                    ×
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div class="summary">
                        <span>Total</span>
                        <strong>{money(cartTotal.value)}</strong>
                    </div>
                </section>

                <form class="panel form" onSubmit={submit}>
                    <h2>Datos de entrega</h2>
                    <Field label="Nombre completo">
                        <input
                            class="input"
                            required
                            maxLength={120}
                            value={form.customer_name}
                            onInput={set('customer_name')}
                            autoComplete="name"
                        />
                    </Field>
                    <Field label="Correo electrónico">
                        <input
                            class="input"
                            type="email"
                            required
                            value={form.email}
                            onInput={set('email')}
                            autoComplete="email"
                        />
                    </Field>
                    <Field label="Teléfono (opcional)">
                        <input
                            class="input"
                            type="tel"
                            maxLength={30}
                            value={form.phone}
                            onInput={set('phone')}
                            autoComplete="tel"
                        />
                    </Field>
                    <Field label="Dirección de entrega">
                        <textarea
                            class="input"
                            required
                            rows={3}
                            maxLength={500}
                            value={form.address}
                            onInput={set('address')}
                            autoComplete="street-address"
                        />
                    </Field>
                    <Field label="Notas (opcional)">
                        <textarea
                            class="input"
                            rows={2}
                            maxLength={1000}
                            value={form.notes}
                            onInput={set('notes')}
                        />
                    </Field>

                    {error && <p class="alert">{error}</p>}

                    <button class="btn btn--block" disabled={sending}>
                        {sending ? 'Enviando…' : `Confirmar pedido · ${money(cartTotal.value)}`}
                    </button>
                    <p class="muted small">Te contactaremos para coordinar el pago y la entrega.</p>
                </form>
            </div>
        </div>
    );
}
