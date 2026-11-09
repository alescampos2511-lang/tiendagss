import type { ComponentChildren } from 'preact';
import { cartCount, toastMsg } from '../cart';
import { route } from '../router';
import { Leaf } from './ui';

export function Layout({ children }: { children: ComponentChildren }) {
    const section = route.value[0] ?? '';
    return (
        <>
            <header class="header">
                <div class="container header__inner">
                    <a href="#/" class="logo">
                        <Leaf class="logo__icon" />
                        <span>Nutrista</span>
                    </a>
                    <nav class="nav">
                        <a href="#/" class={section === '' ? 'is-active' : ''}>
                            Inicio
                        </a>
                        <a
                            href="#/tienda"
                            class={section === 'tienda' || section === 'producto' ? 'is-active' : ''}
                        >
                            Tienda
                        </a>
                        <a
                            href="#/carrito"
                            class={`nav__cart${section === 'carrito' ? ' is-active' : ''}`}
                        >
                            Carrito
                            {cartCount.value > 0 && (
                                <span class="nav__count">{cartCount.value}</span>
                            )}
                        </a>
                    </nav>
                </div>
            </header>

            <main class="main">{children}</main>

            <footer class="footer">
                <div class="container footer__inner">
                    <div>
                        <strong class="footer__brand">Nutrista</strong>
                        <p>Cosmética natural hecha a mano, en pequeños lotes.</p>
                    </div>
                    <a href="#/admin" class="footer__admin">
                        Administración
                    </a>
                </div>
            </footer>

            {toastMsg.value && (
                <div class="toast" role="status">
                    {toastMsg.value}
                </div>
            )}
        </>
    );
}
