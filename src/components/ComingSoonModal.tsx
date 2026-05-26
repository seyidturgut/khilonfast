type Props = {
    open: boolean;
    onClose: () => void;
    lang?: string;
};

// Maestro AI "çok yakında" bilgilendirme modalı.
// Maestro ürünleri henüz satın alınamaz; satın al butonuna basınca bu açılır.
export default function ComingSoonModal({ open, onClose, lang }: Props) {
    if (!open) return null;

    const isEn = lang === 'en';

    const copy = isEn ? {
        title: 'Coming Soon',
        body: 'Our sector-specific Maestro AI service is still under development and will be available very soon.',
        contactLabel: 'For details:',
        close: 'Close',
    } : {
        title: 'Çok Yakında',
        body: 'Sektörünüze özel Maestro AI hizmetimiz için geliştirme çalışmalarımız devam etmekte olup çok yakında kullanıma açılacaktır.',
        contactLabel: 'Detaylı bilgi için:',
        close: 'Kapat',
    };

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '16px',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#fff', borderRadius: '16px',
                    padding: '32px 28px', maxWidth: '440px', width: '100%',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
                    textAlign: 'center',
                }}
            >
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🛠️</div>
                <h3 style={{ margin: '0 0 12px', fontSize: '1.2rem', fontWeight: 700, color: '#1a3a52' }}>
                    {copy.title}
                </h3>
                <p style={{ margin: '0 0 16px', fontSize: '0.95rem', color: '#475569', lineHeight: 1.65 }}>
                    {copy.body}
                </p>
                <p style={{ margin: '0 0 24px', fontSize: '0.92rem', color: '#475569' }}>
                    {copy.contactLabel}{' '}
                    <a
                        href="mailto:info@khilonfast.com"
                        style={{ color: '#89b004', fontWeight: 700, textDecoration: 'none' }}
                    >
                        info@khilonfast.com
                    </a>
                </p>
                <button
                    onClick={onClose}
                    style={{
                        padding: '11px 28px', borderRadius: '10px',
                        border: 'none', background: '#1a3a52',
                        color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                    }}
                >
                    {copy.close}
                </button>
            </div>
        </div>
    );
}
