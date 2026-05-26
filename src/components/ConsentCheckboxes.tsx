// src/components/ConsentCheckboxes.tsx
// 4-katmanlı standart onay komponenti — tüm formlarda kullanılır.
// Spec: formlardaki-checkboxlar-nasil-olmali.docx
//
// Katmanlar:
//   1. main_legal (zorunlu)  — Terms + Privacy + Refund + dijital ifa kabulü
//   2. etk        (opsiyonel, pre-checked DEĞİL) — pazarlama iletişimi
//   3. b2b        (opsiyonel, gösterilirse)     — kurumsal/B2B alım
//   4. auto_renewal (opsiyonel, recurring sub.)  — otomatik yenileme
//
// onChange ile parent'a state geçirilir; submit öncesi parent /api/consent/log çağırır.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { POLICY_VERSION } from '../content/legalContent';
import { getLocalizedPathByKey } from '../utils/locale';
import api from '../services/api';

export interface ConsentState {
    main_legal: boolean;
    etk: boolean;
    b2b: boolean;
    auto_renewal: boolean;
}

export interface ConsentCheckboxesProps {
    context: 'checkout' | 'register' | 'booking' | 'contact';
    isEn: boolean;
    showB2B?: boolean;
    showAutoRenewal?: boolean;
    /** main_legal görünmez yapmak için (örn. contact formu sadece privacy + etk istiyorsa) */
    hideMainLegal?: boolean;
    /** Sadece privacy linkini göster (contact gibi basit formlar için), hizmet şartları/refund linki çıkmaz */
    contactMode?: boolean;
    onChange?: (state: ConsentState) => void;
    /** Submit öncesi parent doğrudan çağırabilsin diye export */
    initial?: Partial<ConsentState>;
}

export const DEFAULT_CONSENT: ConsentState = {
    main_legal: false,
    etk: false,
    b2b: false,
    auto_renewal: false,
};

/**
 * Toplu onay log'unu /api/consent/log'a gönderir (best-effort).
 * Form submit'inden ÖNCE parent çağırır.
 */
export async function logConsents(
    state: ConsentState,
    options: {
        context: ConsentCheckboxesProps['context'];
        email: string;
        productKey?: string;
        orderId?: number;
    }
): Promise<void> {
    const consents: { key: string; state: boolean }[] = [
        { key: 'main_legal', state: state.main_legal },
        { key: 'etk', state: state.etk },
    ];
    if (state.b2b) consents.push({ key: 'b2b', state: true });
    if (state.auto_renewal) consents.push({ key: 'auto_renewal', state: true });
    try {
        await api.post('/consent/log', {
            context: options.context,
            policy_version: POLICY_VERSION,
            consents,
            email: options.email,
            product_key: options.productKey || null,
            order_id: options.orderId || null,
        });
    } catch {
        // best-effort — sessiz başarısızlık
    }
}

export default function ConsentCheckboxes({
    context,
    isEn,
    showB2B = false,
    showAutoRenewal = false,
    hideMainLegal = false,
    contactMode = false,
    onChange,
    initial,
}: ConsentCheckboxesProps) {
    const [state, setState] = useState<ConsentState>({
        ...DEFAULT_CONSENT,
        ...(initial || {}),
    });

    const update = (key: keyof ConsentState, val: boolean) => {
        const next = { ...state, [key]: val };
        setState(next);
        onChange?.(next);
    };

    const lang = isEn ? 'en' : 'tr';
    const termsHref = getLocalizedPathByKey(lang, 'termsOfService');
    const privacyHref = getLocalizedPathByKey(lang, 'privacyPolicy');
    const refundHref = getLocalizedPathByKey(lang, 'refundPolicy');
    const b2bHref = getLocalizedPathByKey(lang, 'corporateB2B');

    const idPrefix = `cc-${context}-`;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem', lineHeight: 1.5, color: '#475569' }}>
            {/* 1) Ana hukuk — zorunlu */}
            {!hideMainLegal && (
                <div style={rowStyle}>
                    <input
                        type="checkbox"
                        id={`${idPrefix}main`}
                        checked={state.main_legal}
                        onChange={e => update('main_legal', e.target.checked)}
                        required
                        style={inputStyle}
                    />
                    <label htmlFor={`${idPrefix}main`} style={labelStyle}>
                        {contactMode ? (
                            <>
                                <Link to={privacyHref} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                                    {isEn ? 'Privacy Policy' : 'Gizlilik Politikası'}
                                </Link>
                                {isEn ? '’s terms — read and accepted.' : '’nı okudum ve kabul ediyorum.'}
                            </>
                        ) : isEn ? (
                            <>
                                I agree to the{' '}
                                <Link to={termsHref} target="_blank" rel="noopener noreferrer" style={linkStyle}>Terms of Service</Link>,{' '}
                                <Link to={privacyHref} target="_blank" rel="noopener noreferrer" style={linkStyle}>Privacy Policy</Link>, and{' '}
                                <Link to={refundHref} target="_blank" rel="noopener noreferrer" style={linkStyle}>Cancellation &amp; Refund Policy</Link>.
                                I understand that access to digital services, subscriptions, educational content, AI-powered tools, or consulting services may begin immediately after payment.
                            </>
                        ) : (
                            <>
                                <Link to={termsHref} target="_blank" rel="noopener noreferrer" style={linkStyle}>Hizmet Şartları</Link>,{' '}
                                <Link to={privacyHref} target="_blank" rel="noopener noreferrer" style={linkStyle}>Gizlilik Politikası</Link> ve{' '}
                                <Link to={refundHref} target="_blank" rel="noopener noreferrer" style={linkStyle}>İptal &amp; İade Politikası</Link>'nı okudum ve kabul ediyorum.
                                Dijital hizmet, abonelik, eğitim içeriği, yapay zeka araçları veya danışmanlığa erişimin ödeme sonrası başlayabileceğini anlıyorum.
                            </>
                        )}
                    </label>
                </div>
            )}

            {/* 2) ETK / Pazarlama iletişimi — opsiyonel */}
            <div style={rowStyle}>
                <input
                    type="checkbox"
                    id={`${idPrefix}etk`}
                    checked={state.etk}
                    onChange={e => update('etk', e.target.checked)}
                    style={inputStyle}
                />
                <label htmlFor={`${idPrefix}etk`} style={{ ...labelStyle, color: '#64748b', fontSize: '0.8rem' }}>
                    {isEn
                        ? 'I agree to receive updates, educational content, product announcements, webinar invitations, marketing communications, and promotional messages from Khilonfast via email, SMS, phone, or similar communication channels.'
                        : 'Khilonfast’tan e-posta, SMS, telefon ve benzeri iletişim kanalları üzerinden güncellemeler, eğitim içerikleri, ürün duyuruları, webinar davetleri, pazarlama iletişimi ve promosyon mesajları almayı kabul ediyorum.'}
                </label>
            </div>

            {/* 3) B2B — koşullu */}
            {showB2B && (
                <div style={rowStyle}>
                    <input
                        type="checkbox"
                        id={`${idPrefix}b2b`}
                        checked={state.b2b}
                        onChange={e => update('b2b', e.target.checked)}
                        style={inputStyle}
                    />
                    <label htmlFor={`${idPrefix}b2b`} style={{ ...labelStyle, color: '#64748b', fontSize: '0.8rem' }}>
                        {isEn
                            ? 'I confirm that this purchase is made on behalf of a business, organization, or professional activity.'
                            : 'Bu satın almayı bir işletme, kurum veya profesyonel faaliyet adına yaptığımı doğrularım.'}
                        {state.b2b && (
                            <>
                                {' '}
                                <Link to={b2bHref} target="_blank" rel="noopener noreferrer" style={{ ...linkStyle, fontSize: '0.78rem' }}>
                                    {isEn ? 'Corporate / B2B Supplemental Terms' : 'Kurumsal / B2B Ek Şartlar'}
                                </Link>
                            </>
                        )}
                    </label>
                </div>
            )}

            {/* 4) Auto-renewal — koşullu */}
            {showAutoRenewal && (
                <div style={rowStyle}>
                    <input
                        type="checkbox"
                        id={`${idPrefix}autorenew`}
                        checked={state.auto_renewal}
                        onChange={e => update('auto_renewal', e.target.checked)}
                        style={inputStyle}
                    />
                    <label htmlFor={`${idPrefix}autorenew`} style={{ ...labelStyle, color: '#64748b', fontSize: '0.8rem' }}>
                        {isEn
                            ? 'I understand that subscription services may renew automatically unless cancelled before the next billing cycle.'
                            : 'Bir sonraki fatura döngüsünden önce iptal edilmediği takdirde abonelik hizmetlerinin otomatik olarak yenilenebileceğini anlıyorum.'}
                    </label>
                </div>
            )}
        </div>
    );
}

const rowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
};

const inputStyle: React.CSSProperties = {
    width: 16,
    height: 16,
    minWidth: 16,
    margin: '3px 0 0',
    flexShrink: 0,
    accentColor: '#1a3a52',
    cursor: 'pointer',
};

const labelStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '0.85rem',
    lineHeight: 1.45,
    color: '#475569',
    fontWeight: 'normal',
    cursor: 'pointer',
};

const linkStyle: React.CSSProperties = {
    color: '#1a3a52',
    textDecoration: 'underline',
    fontWeight: 600,
};
