import { signal } from '@preact/signals';

// Rutas con hash: #/, #/tienda, #/tienda/<categoria>, #/producto/3, #/carrito, #/pedido/<id>, #/admin
const parse = () =>
    (location.hash.slice(1) || '/').split('/').filter(Boolean).map(decodeURIComponent);

export const route = signal<string[]>(parse());

window.addEventListener('hashchange', () => {
    const prev = route.value[0];
    route.value = parse();
    // Cambiar de categoría dentro de la tienda no regresa al inicio de la página
    if (!(prev === 'tienda' && route.value[0] === 'tienda')) window.scrollTo(0, 0);
});

export const navigate = (path: string) => (location.hash = path);
