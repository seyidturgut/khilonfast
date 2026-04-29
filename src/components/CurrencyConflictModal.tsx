import { useCart } from '../context/CartContext';
import { useRouteLocale } from '../utils/locale';

export default function CurrencyConflictModal() {
    const { currencyConflict, resolveCurrencyConflict } = useCart();
    const locale = useRouteLocale();
    const isEn = locale === 'en';

    if (!currencyConflict) return null;

    const { existingCurrency, incomingCurrency } = currencyConflict;

    const copy = isEn ? {
        title: 'Currency Mismatch',
        body: (
            <>
                Your cart contains items priced in <strong>{existingCurrency}</strong>.
                The item you want to add is priced in <strong>{incomingCurrency}</strong>.
                <br /><br />
                Would you like to clear your cart and add this item?
            </>
        ),
        cancel: 'Cancel',
        confirm: 'Clear Cart & Add',
    } : {
        title: 'Para Birimi Uyuşmazlığı',
        body: (
            <>
                Sepetinizde <strong>{existingCurrency}</strong> para birimli ürün bulunuyor.
                Eklemek istediğiniz ürün <strong>{incomingCurrency}</strong> para birimi ile fiyatlandırılmış.
                <br /><br />
                Sepeti temizleyip yeni ürünü eklemek ister misiniz?
            </>
        ),
        cancel: 'Vazgeç',
        confirm: 'Sepeti Temizle & Ekle',
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
        }}>
            <div style={{
                background: '#fff', borderRadius: '16px',
                padding: '32px 28px', maxWidth: '420px', width: '100%',
                boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
            }}>
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🛒</div>
                <h3 style={{ margin: '0 0 10px', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                    {copy.title}
                </h3>
                <p style={{ margin: '0 0 24px', fontSize: '0.92rem', color: '#475569', lineHeight: 1.6 }}>
                    {copy.body}
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => resolveCurrencyConflict(false)}
                        style={{
                            flex: 1, padding: '11px 16px', borderRadius: '10px',
                            border: '1px solid #e2e8f0', background: '#f8fafc',
                            color: '#475569', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                        }}
                    >
                        {copy.cancel}
                    </button>
                    <button
                        onClick={() => resolveCurrencyConflict(true)}
                        style={{
                            flex: 1, padding: '11px 16px', borderRadius: '10px',
                            border: 'none', background: '#ef4444',
                            color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                        }}
                    >
                        {copy.confirm}
                    </button>
                </div>
            </div>
        </div>
    );
}
