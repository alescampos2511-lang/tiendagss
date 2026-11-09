import { api } from '../api';
import { STATUS_LABEL, date, money, useAsync } from '../lib';
import { ErrorBox, Loading } from '../components/ui';

const STEPS = ['pendiente', 'pagado', 'enviado', 'entregado'] as const;

export function OrderPage({ id, isNew }: { id: string; isNew: boolean }) {
    const { data: o, error, loading, reload } = useAsync(() => api.order(id), [id]);

    if (loading)
        return (
            <div class="container page">
                <Loading />
            </div>
        );
    if (error || !o)
        return (
            <div class="container page">
                <ErrorBox message={error ?? 'Pedido no encontrado'} onRetry={reload} />
            </div>
        );

    const current = STEPS.indexOf(o.status as (typeof STEPS)[number]);

    return (
        <div class="container page page--narrow">
            {isNew && (
                <div class="thanks">
                    <h1>¡Gracias, {o.customer_name.split(' ')[0]}!</h1>
                    <p>Recibimos tu pedido. Guarda esta página para consultar su estado.</p>
                </div>
            )}

            <section class="panel">
                <div class="order__head">
                    <div>
                        <span class="eyebrow">Pedido</span>
                        <h2 class="order__id">#{o.id.slice(0, 8).toUpperCase()}</h2>
                        <span class="muted small">{date(o.created_at)}</span>
                    </div>
                    <span class={`badge badge--${o.status}`}>{STATUS_LABEL[o.status]}</span>
                </div>

                {o.status !== 'cancelado' && (
                    <ol class="steps">
                        {STEPS.map((s, i) => (
                            <li key={s} class={i <= current ? 'is-done' : ''}>
                                {STATUS_LABEL[s]}
                            </li>
                        ))}
                    </ol>
                )}

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
                <div class="summary">
                    <span>Total</span>
                    <strong>{money(o.total)}</strong>
                </div>

                <div class="order__ship">
                    <span class="eyebrow">Entrega</span>
                    <p>
                        {o.customer_name}
                        <br />
                        {o.address}
                    </p>
                </div>
            </section>

            <a href="#/tienda" class="back">
                ← Seguir comprando
            </a>
        </div>
    );
}
