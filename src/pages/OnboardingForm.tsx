import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRouteLocale } from '../utils/locale';
import api from '../services/api';
import {
    ONBOARDING_SECTIONS,
    buildInitialFormData,
} from '../content/onboardingSchema';
import '../styles/OnboardingForm.css';

type FormData = Record<string, Record<string, string>>;

export default function OnboardingForm() {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('order_id');
    const orderItemId = searchParams.get('order_item_id');
    const navigate = useNavigate();
    const { user } = useAuth();
    const currentLang = useRouteLocale();
    const isEn = currentLang === 'en';

    const draftKey = `onboarding_draft_${orderId || 'unknown'}_${orderItemId || 'item'}`;

    const [formData, setFormData] = useState<FormData>(() => {
        // localStorage'dan draft yükle, yoksa boş başla
        try {
            const saved = orderId ? localStorage.getItem(draftKey) : null;
            if (saved) return { ...buildInitialFormData(), ...JSON.parse(saved) };
        } catch {}
        return buildInitialFormData();
    });
    const [currentSection, setCurrentSection] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);
    const [productNames, setProductNames] = useState('');
    const [draftSaved, setDraftSaved] = useState(false);

    const presentationPath = isEn
        ? `/en/onboarding-presentation/${orderId}`
        : `/onboarding-sunumu/${orderId}`;
    const dashboardPath = isEn ? '/en/dashboard' : '/dashboard';

    // Auth + sipariş kontrolü, mevcut form var mı bak
    useEffect(() => {
        if (!user) {
            navigate(isEn ? '/en/login' : '/giris');
            return;
        }
        if (!orderId || !orderItemId) {
            navigate(dashboardPath);
            return;
        }
        // Bu sipariş için item bazlı durumu çek; ilgili kalemde form var mı?
        api.get(`/onboarding-form/order/${orderId}/items`).then(res => {
            const items = Array.isArray(res.data?.items) ? res.data.items : [];
            const me = items.find((it: any) => Number(it.order_item_id) === Number(orderItemId));
            if (me?.exists) setAlreadySubmitted(true);
            if (me?.product_name) setProductNames(me.product_name);
        }).catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId, orderItemId]);

    // Auto-save draft (debounce 800ms)
    useEffect(() => {
        if (!orderId) return;
        const t = setTimeout(() => {
            try {
                localStorage.setItem(draftKey, JSON.stringify(formData));
                setDraftSaved(true);
                setTimeout(() => setDraftSaved(false), 1500);
            } catch {}
        }, 800);
        return () => clearTimeout(t);
    }, [formData, orderId, draftKey]);

    const updateField = (sectionKey: string, fieldKey: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [sectionKey]: { ...(prev[sectionKey] || {}), [fieldKey]: value }
        }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            await api.post('/onboarding-form', {
                order_id: Number(orderId),
                order_item_id: Number(orderItemId),
                product_names: productNames,
                form_data: formData
            });
            // Draft sil
            try { localStorage.removeItem(draftKey); } catch {}
            navigate(presentationPath);
        } catch (err: any) {
            setError(err.response?.data?.error || (isEn ? 'Form could not be submitted.' : 'Form gönderilemedi. Lütfen tekrar deneyin.'));
        } finally {
            setLoading(false);
        }
    };

    if (alreadySubmitted) {
        return (
            <div className="onboarding-page">
                <div className="onboarding-container">
                    <div className="onboarding-already-done">
                        <div className="onboarding-check">✓</div>
                        <h2>{isEn ? 'Form Already Submitted' : 'Form Daha Önce Gönderildi'}</h2>
                        <p>{isEn ? 'You have already submitted the onboarding form for this order. Our team will get back to you shortly.' : 'Bu sipariş için onboarding formunu zaten doldurdunuz. Stratejik brifiniz hazırlanıyor.'}</p>
                        <button className="onboarding-btn-primary" onClick={() => navigate(presentationPath)}>
                            {isEn ? 'View Strategic Brief' : 'Stratejik Brifimi Gör'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const section = ONBOARDING_SECTIONS[currentSection];
    const sectionKey = section.key;
    const isLast = currentSection === ONBOARDING_SECTIONS.length - 1;
    const progress = Math.round(((currentSection + 1) / ONBOARDING_SECTIONS.length) * 100);

    return (
        <div className="onboarding-page">
            <div className="onboarding-container">
                <div className="onboarding-header">
                    <span className="onboarding-eyebrow">{isEn ? 'Strategic Brief' : 'Stratejik Brif'}</span>
                    <h1>{isEn ? 'Onboarding Form' : 'Onboarding Formu'}</h1>
                    {productNames && <p className="onboarding-product-name">{productNames}</p>}
                    <p className="onboarding-intro">
                        {isEn
                            ? 'Help us craft your personalized strategy. The more detail you share, the sharper our insights will be.'
                            : 'Stratejimizi size özel hale getirmek için bilgilerinizi paylaşın. Detay verdikçe içgörümüz keskinleşir.'}
                    </p>
                </div>

                {/* Dot timeline */}
                <div className="onboarding-timeline">
                    {ONBOARDING_SECTIONS.map((s, idx) => (
                        <button
                            key={s.key}
                            type="button"
                            className={`onboarding-timeline-dot ${idx === currentSection ? 'active' : ''} ${idx < currentSection ? 'done' : ''}`}
                            onClick={() => setCurrentSection(idx)}
                            title={isEn ? s.title_en : s.title}
                        >
                            <span className="onboarding-timeline-num">{idx + 1}</span>
                        </button>
                    ))}
                </div>

                <div className="onboarding-progress-bar">
                    <div className="onboarding-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="onboarding-progress-text">
                    {currentSection + 1} / {ONBOARDING_SECTIONS.length} — %{progress}
                    {draftSaved && (
                        <span style={{ marginLeft: 12, color: '#22c55e', fontSize: '0.78rem' }}>
                            ✓ {isEn ? 'Draft saved' : 'Taslak kaydedildi'}
                        </span>
                    )}
                </p>

                <div className="onboarding-section">
                    <h2 className="onboarding-section-title">
                        <span className="onboarding-section-num">Bölüm {currentSection + 1}</span>
                        {isEn ? section.title_en : section.title}
                    </h2>
                    {(isEn ? section.description_en : section.description) && (
                        <p className="onboarding-section-desc">
                            {isEn ? section.description_en : section.description}
                        </p>
                    )}

                    {section.fields.map(field => {
                        const displayLabel = isEn ? field.label_en : field.label;
                        const value = formData[sectionKey]?.[field.key] || '';
                        return (
                            <div className="onboarding-field" key={field.key}>
                                <label>{displayLabel}</label>
                                {field.type === 'textarea' ? (
                                    <textarea
                                        value={value}
                                        onChange={e => updateField(sectionKey, field.key, e.target.value)}
                                        rows={3}
                                        placeholder={isEn ? `${displayLabel}...` : `${displayLabel}...`}
                                    />
                                ) : (
                                    <input
                                        type={field.type}
                                        value={value}
                                        onChange={e => updateField(sectionKey, field.key, e.target.value)}
                                        placeholder={isEn ? `${displayLabel}...` : `${displayLabel}...`}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {error && <p className="onboarding-error">{error}</p>}

                <div className="onboarding-nav">
                    {currentSection > 0 && (
                        <button className="onboarding-btn-secondary" onClick={() => setCurrentSection(s => s - 1)}>
                            {isEn ? '← Previous' : '← Önceki'}
                        </button>
                    )}
                    {!isLast ? (
                        <button className="onboarding-btn-primary" onClick={() => setCurrentSection(s => s + 1)}>
                            {isEn ? 'Next →' : 'Sonraki →'}
                        </button>
                    ) : (
                        <button className="onboarding-btn-submit" onClick={handleSubmit} disabled={loading}>
                            {loading ? (isEn ? 'Submitting...' : 'Gönderiliyor...') : (isEn ? 'Submit Form' : 'Formu Gönder')}
                        </button>
                    )}
                </div>

                <p className="onboarding-skip">
                    {isEn ? 'Want to fill it out later? Your progress is saved automatically.' : 'Daha sonra doldurmak ister misiniz? İlerlemeniz otomatik kaydediliyor.'}{' '}
                    <button className="onboarding-link" onClick={() => navigate(dashboardPath)}>
                        {isEn ? 'Back to dashboard' : 'Dashboard\'a dön'}
                    </button>
                </p>
            </div>
        </div>
    );
}
