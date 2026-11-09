import { useState } from 'preact/hooks';
import { api } from '../api';
import { addToCart } from '../cart';
import { categoryLabel, money, useAsync } from '../lib';
import { ErrorBox, Loading, ProductTile, QtyStepper } from '../components/ui';

export function ProductPage({ id }: { id: number }) {
    const { data: p, error, loading, reload } = useAsync(() => api.product(id), [id]);
    const [qty, setQty] = useState(1);

    if (loading)
        return (
            <div class="container page">
                <Loading />
            </div>
        );
    if (error || !p)
        return (
            <div class="container page">
                <ErrorBox message={error ?? 'Producto no encontrado'} onRetry={reload} />
            </div>
        );

    const out = p.stock === 0;
    return (
        <div class="container page">
            <a href="#/tienda" class="back">
                ← Volver a la tienda
            </a>
            <div class="detail">
                <ProductTile product={p} large />
                <div class="detail__info">
                    <span class="eyebrow">{categoryLabel(p.category)}</span>
                    <h1>{p.name}</h1>
                    <p class="detail__price">{money(p.price)}</p>
                    {p.description && <p class="detail__desc">{p.description}</p>}

                    <p class={`stock${out ? ' stock--out' : p.stock <= 5 ? ' stock--low' : ''}`}>
                        {out
                            ? 'Agotado por ahora'
                            : p.stock <= 5
                              ? `¡Quedan solo ${p.stock}!`
                              : 'Disponible'}
                    </p>

                    {!out && (
                        <div class="detail__buy">
                            <QtyStepper value={qty} max={p.stock} onChange={setQty} />
                            <button
                                class="btn"
                                onClick={() => {
                                    addToCart(p, qty);
                                    setQty(1);
                                }}
                            >
                                Agregar al carrito
                            </button>
                        </div>
                    )}

                    <ul class="perks">
                        <li>Hecho a mano en pequeños lotes</li>
                        <li>Ingredientes naturales, sin parabenos</li>
                        <li>No probado en animales</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
