import { useEffect, useState } from 'preact/hooks';

const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
export const money = (cents: number) => mxn.format(cents / 100);

const dateFmt = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
// SQLite guarda "YYYY-MM-DD HH:MM:SS" en UTC
export const date = (s: string) => dateFmt.format(new Date(s.replace(' ', 'T') + 'Z'));

export const categoryLabel = (c: string) => {
    const s = c.replace(/-/g, ' ');
    return s.charAt(0).toUpperCase() + s.slice(1);
};

export const STATUS_LABEL: Record<string, string> = {
    pendiente: 'Pendiente',
    pagado: 'Pagado',
    enviado: 'Enviado',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
};

/** Carga datos asíncronos y se vuelve a ejecutar cuando cambian las deps. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
    const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>({
        loading: true,
    });
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let alive = true;
        setState((s) => ({ ...s, loading: true, error: undefined }));
        fn()
            .then((data) => alive && setState({ data, loading: false }))
            .catch((e: Error) => alive && setState({ error: e.message, loading: false }));
        return () => {
            alive = false;
        };
    }, [...deps, tick]);

    return { ...state, reload: () => setTick((t) => t + 1) };
}
