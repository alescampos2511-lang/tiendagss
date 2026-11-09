import { render } from 'preact';
import { route } from './router';
import { Layout } from './components/Layout';
import { Catalog } from './pages/Catalog';
import { Home } from './pages/Home';
import { ProductPage } from './pages/ProductPage';
import { Cart } from './pages/Cart';
import { OrderPage } from './pages/OrderPage';
import { Admin } from './pages/Admin';
import { Empty } from './components/ui';
import './styles.css';

function App() {
    const [section, param, extra] = route.value;
    let page;
    switch (section) {
        case undefined:
            page = <Home />;
            break;
        case 'tienda':
            page = <Catalog category={param ?? ''} />;
            break;
        case 'producto':
            page = <ProductPage id={Number(param)} />;
            break;
        case 'carrito':
            page = <Cart />;
            break;
        case 'pedido':
            page = <OrderPage id={param ?? ''} isNew={extra === 'gracias'} />;
            break;
        case 'admin':
            page = <Admin />;
            break;
        default:
            page = (
                <div class="container page">
                    <Empty title="Página no encontrada">
                        <a href="#/" class="btn">
                            Ir al inicio
                        </a>
                    </Empty>
                </div>
            );
    }
    return <Layout>{page}</Layout>;
}

render(<App />, document.getElementById('app')!);
