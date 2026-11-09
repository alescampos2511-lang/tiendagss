import { api, type Product } from '../api';
import { categoryLabel, useAsync } from '../lib';
import { CategoryIcon, Leaf, ProductCard, tint } from '../components/ui';

const FEATURES = [
    {
        icon: 'facial',
        title: 'Ingredientes naturales',
        text: 'Aceites vegetales, mantecas, arcillas y hierbas. Nada que no puedas pronunciar.',
    },
    {
        icon: 'cremas',
        title: 'Hecho a mano',
        text: 'Elaboramos en lotes pequeños para que cada pieza llegue fresca a tu casa.',
    },
    {
        icon: 'cuidado-personal',
        title: 'Sin químicos agresivos',
        text: 'Sin parabenos, sulfatos ni fragancias sintéticas. Amable con tu piel y el planeta.',
    },
];

const STEPS = [
    { title: 'Elige tus productos', text: 'Explora el catálogo y agrega lo que te guste al carrito.' },
    { title: 'Haz tu pedido', text: 'Solo deja tus datos de entrega, no necesitas crear una cuenta.' },
    { title: 'Te contactamos', text: 'Coordinamos contigo el pago y la entrega a domicilio.' },
];

/** Un producto disponible por categoría, para mostrar variedad. */
function pickFeatured(products: Product[], n = 4) {
    const seen = new Set<string>();
    const out: Product[] = [];
    for (const p of products) {
        if (p.stock > 0 && !seen.has(p.category)) {
            seen.add(p.category);
            out.push(p);
            if (out.length === n) break;
        }
    }
    return out;
}

export function Home() {
    const cats = useAsync(() => api.categories(), []);
    const products = useAsync(() => api.products(), []);
    const total = cats.data?.reduce((n, c) => n + c.count, 0);
    const featured = products.data ? pickFeatured(products.data) : [];

    return (
        <>
            <section class="landing-hero">
                <div class="container landing-hero__inner">
                    <div class="landing-hero__text">
                        <span class="eyebrow">Hecho a mano · Ingredientes naturales</span>
                        <h1>
                            Cuidado natural, <em>hecho en casa</em>
                        </h1>
                        <p>
                            En Nutrista elaboramos jabones, shampoos, cremas y aceites con
                            ingredientes de la tierra, en pequeños lotes y con mucho cariño.
                            Cosmética honesta para el cuidado diario de toda la familia.
                        </p>
                        <div class="landing-hero__cta">
                            <a href="#/tienda" class="btn btn--lg">
                                Ver productos
                            </a>
                            <button
                                type="button"
                                class="btn btn--ghost btn--lg"
                                onClick={() =>
                                    document
                                        .getElementById('como-funciona')
                                        ?.scrollIntoView({ behavior: 'smooth' })
                                }
                            >
                                Cómo funciona
                            </button>
                        </div>
                        {total ? (
                            <p class="landing-hero__meta">
                                {total} productos artesanales · {cats.data!.length} categorías
                            </p>
                        ) : null}
                    </div>

                    <div class="landing-hero__art" aria-hidden="true">
                        {['jabones', 'aceites', 'cremas', 'velas'].map((c) => (
                            <div class="art-tile" style={{ background: tint(c) }}>
                                <CategoryIcon category={c} />
                            </div>
                        ))}
                        <Leaf class="landing-hero__leaf" />
                    </div>
                </div>
            </section>

            <section class="container section">
                <div class="features">
                    {FEATURES.map((f) => (
                        <div class="feature" key={f.title}>
                            <span class="feature__icon">
                                <CategoryIcon category={f.icon} />
                            </span>
                            <h3>{f.title}</h3>
                            <p>{f.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            {cats.data && cats.data.length > 0 && (
                <section class="container section">
                    <div class="section__head">
                        <h2>Explora por categoría</h2>
                        <a href="#/tienda" class="section__link">
                            Ver todo →
                        </a>
                    </div>
                    <div class="cat-grid">
                        {cats.data.map((c) => (
                            <a
                                key={c.name}
                                href={`#/tienda/${encodeURIComponent(c.name)}`}
                                class="cat-tile"
                                style={{ background: tint(c.name) }}
                            >
                                <CategoryIcon category={c.name} />
                                <span class="cat-tile__name">{categoryLabel(c.name)}</span>
                                <span class="cat-tile__count">
                                    {c.count} {c.count === 1 ? 'producto' : 'productos'}
                                </span>
                            </a>
                        ))}
                    </div>
                </section>
            )}

            {featured.length > 0 && (
                <section class="container section">
                    <div class="section__head">
                        <h2>Favoritos de la casa</h2>
                        <a href="#/tienda" class="section__link">
                            Ver tienda →
                        </a>
                    </div>
                    <div class="grid">
                        {featured.map((p) => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                </section>
            )}

            <section class="howto" id="como-funciona">
                <div class="container">
                    <h2>Cómo funciona</h2>
                    <ol class="howto__steps">
                        {STEPS.map((s) => (
                            <li key={s.title}>
                                <h3>{s.title}</h3>
                                <p>{s.text}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            <section class="container section">
                <div class="cta-band">
                    <div>
                        <h2>Tu piel merece lo natural</h2>
                        <p>Descubre todo lo que preparamos para ti esta temporada.</p>
                    </div>
                    <a href="#/tienda" class="btn btn--light btn--lg">
                        Ir a la tienda
                    </a>
                </div>
            </section>
        </>
    );
}
