import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

// Kök seviye hata sınırı — herhangi bir bileşenin render/lifecycle/effect'inde
// yakalanmamış bir hata olursa, TÜM uygulamayı unmount edip beyaz ekran
// göstermek yerine (React 18 varsayılan davranışı) kullanıcıya toparlanabilir
// bir fallback + "Yeniden Dene" gösterir. Hatayı /api/client-error'a da raporlar.
class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        try {
            const body = JSON.stringify({
                type: 'react_error_boundary',
                message: String(error?.message || error || 'unknown').slice(0, 1000),
                stack: String(error?.stack || '').slice(0, 2000),
                source: String(info?.componentStack || '').slice(0, 300),
                url: window.location.href
            });
            if (navigator.sendBeacon) {
                navigator.sendBeacon('/api/client-error', new Blob([body], { type: 'application/json' }));
            }
        } catch { /* raporlama asla ek hata üretmesin */ }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#1a3a52', color: '#fff', fontFamily: 'system-ui, Arial, sans-serif',
                    textAlign: 'center', padding: 24, boxSizing: 'border-box'
                }}>
                    <div>
                        <p style={{ margin: '0 0 16px', fontSize: 17 }}>Sayfa yüklenirken bir sorun oluştu.</p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                background: '#C5D63D', color: '#1a3a52', border: 'none', fontWeight: 700,
                                padding: '12px 28px', borderRadius: 8, fontSize: 15, cursor: 'pointer'
                            }}
                        >
                            Yeniden Dene
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
