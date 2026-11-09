import { useEffect, useState } from 'preact/hooks';
import { api } from '../api';
import { categoryLabel, useAsync } from '../lib';
import { navigate } from '../router';
import { Empty, ErrorBox, Loading, ProductCard } from '../components/ui';

// La categoría vive en la URL (#/tienda/<categoria>) para poder compartirla
const setCategory = (c: string) => navigate(c ? `/tienda/${encodeURIComponent(c)}` : '/tienda');

export function Catalog({ category }: { category: string }) {
    const [search, setSearch] = useState('');
    const [q, setQ] = useState('');

    // Espera un momento antes de buscar mientras el usuario escribe
    useEffect(() => {
        const t = setTimeout(() => setQ(search.trim()), 250);
        return () => clearTimeout(t);
    }, [search]);

    const cats = useAsync(() => api.categories(), []);
    const products = useAsync(() => api.products({ category, q }), [category, q]);

    return (
        <>
            <section class="shop-head">
                <div class="container">
                    <span class="eyebrow">Tienda</span>
                    <h1>{category ? categoryLabel(category) : 'Todos los productos'}</h1>
                    <p>Hechos a mano en pequeños lotes, con ingredientes naturales.</p>
                </div>
            </section>

            <section class="container shop">
                <div class="toolbar">
                    <div class="chips" role="tablist">
                        <button
                            class={`chip${category === '' ? ' is-active' : ''}`}
                            onClick={() => setCategory('')}
                        >
                            Todo
                        </button>
                        {cats.data?.map((c) => (
                            <button
                                key={c.name}
                                class={`chip${category === c.name ? ' is-active' : ''}`}
                                onClick={() => setCategory(c.name)}
                            >
                                {categoryLabel(c.name)}
                            </button>
                        ))}
                    </div>
                    <input
                        class="input search"
                        type="search"
                        placeholder="Buscar productos…"
                        value={search}
                        onInput={(e) => setSearch(e.currentTarget.value)}
                    />
                </div>

                {products.error ? (
                    <ErrorBox message={products.error} onRetry={products.reload} />
                ) : products.loading && !products.data ? (
                    <Loading />
                ) : products.data!.length === 0 ? (
                    <Empty title="No encontramos productos">
                        <p>Prueba con otra búsqueda o categoría.</p>
                    </Empty>
                ) : (
                    <div class={`grid${products.loading ? ' is-loading' : ''}`}>
                        {products.data!.map((p) => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                )}
            </section>
        </>
    );
}
