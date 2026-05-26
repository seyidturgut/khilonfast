import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRouteLocale } from '../utils/locale';
import api from '../services/api';

interface FollowupQuestion {
    id: string;
    question: string;
    answer: string | null;
    answered_at: string | null;
}

interface RebriefData {
    template_key: string;
    intro: string;
    sections: { key: string; title: string; content: string }[];
}

interface FormDetail {
    id: number;
    submitted_at: string;
    status: 'new' | 'reviewed' | 'awaiting_user_response' | 'approved';
    form_data: Record<string, Record<string, string>>;
    product_names: string;
    admin_general_note: string | null;
    admin_section_notes: Record<string, string> | null;
    admin_followup_questions: FollowupQuestion[] | null;
    rebrief_data: RebriefData | null;
    approved_at: string | null;
}

export default function OnboardingPresentation() {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const currentLang = useRouteLocale();
    const isEn = currentLang === 'en';

    const [form, setForm] = useState<FormDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [followupAnswers, setFollowupAnswers] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitMsg, setSubmitMsg] = useState('');

    const dashboardPath = isEn ? '/en/dashboard' : '/dashboard';
    const homePath = isEn ? '/en' : '/';

    useEffect(() => {
        if (!user) {
            navigate(isEn ? '/en/login' : '/giris');
            return;
        }
        if (!orderId) {
            navigate(dashboardPath);
            return;
        }
        api.get(`/onboarding-form/order/${orderId}`).then(res => {
            if (res.data.exists && res.data.form) {
                setForm(res.data.form);
                // Initialize followup answers from existing data
                const fq = res.data.form.admin_followup_questions || [];
                const initial: Record<string, string> = {};
                fq.forEach((q: FollowupQuestion) => {
                    if (q.answer) initial[q.id] = q.answer;
                });
                setFollowupAnswers(initial);
            } else {
                // Form yok — kullanıcı henüz doldurmadı
                navigate(`${isEn ? '/en' : ''}/onboarding-form?order_id=${orderId}`);
            }
        }).catch(() => {
            navigate(dashboardPath);
        }).finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId]);

    const submitFollowup = async () => {
        if (!form) return;
        const answers = (form.admin_followup_questions || []).map(q => ({
            id: q.id,
            answer: followupAnswers[q.id] || ''
        }));
        if (answers.some(a => !a.answer.trim())) {
            setSubmitMsg(isEn ? 'Please answer all questions.' : 'Lütfen tüm soruları cevaplayın.');
            return;
        }
        setSubmitting(true);
        setSubmitMsg('');
        try {
            await api.post(`/onboarding-form/answer-followup/${form.id}`, { answers });
            setSubmitMsg(isEn ? '✓ Answers submitted. Our team will review.' : '✓ Cevaplarınız iletildi. Ekibimiz inceleyecek.');
            // Reload
            const res = await api.get(`/onboarding-form/order/${orderId}`);
            setForm(res.data.form);
        } catch (err: any) {
            setSubmitMsg(err.response?.data?.error || (isEn ? 'Submission failed.' : 'Gönderilemedi.'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={pageStyle}>
                <div style={cardStyle}>
                    <p style={{ color: '#64748b' }}>{isEn ? 'Loading...' : 'Yükleniyor...'}</p>
                </div>
            </div>
        );
    }

    if (!form) {
        return (
            <div style={pageStyle}>
                <div style={cardStyle}>
                    <p>{isEn ? 'Form not found.' : 'Form bulunamadı.'}</p>
                </div>
            </div>
        );
    }

    // STATUS: new / reviewed → "Stratejimiz hazırlanıyor"
    if (form.status === 'new' || form.status === 'reviewed') {
        return (
            <div style={pageStyle}>
                <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 40px' }}>
                    <div style={{ width: 84, height: 84, margin: '0 auto 24px', borderRadius: '50%', background: 'linear-gradient(135deg,#1a3a52,#89b004)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: '#fff', boxShadow: '0 12px 32px rgba(26,58,82,0.2)' }}>
                        ⏳
                    </div>
                    <h1 style={{ margin: '0 0 12px', color: '#1a3a52', fontSize: 28 }}>
                        {isEn ? 'Your strategic brief is being prepared' : 'Stratejik brifiniz hazırlanıyor'}
                    </h1>
                    <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.7, maxWidth: 540, margin: '0 auto 28px' }}>
                        {isEn
                            ? 'Our team is reviewing your form and crafting a personalized strategy. You will receive an email when it\'s ready (typically within 2-3 business days).'
                            : 'Ekibimiz formunuzu inceliyor ve size özel bir strateji hazırlıyor. Hazır olduğunda mail göndereceğiz (genellikle 2-3 iş günü içinde).'}
                    </p>
                    <button onClick={() => navigate(dashboardPath)} style={btnPrimary}>
                        {isEn ? 'Back to Dashboard' : 'Dashboard\'a Dön'}
                    </button>
                </div>
            </div>
        );
    }

    // STATUS: awaiting_user_response → ek sorular formu
    if (form.status === 'awaiting_user_response') {
        const questions = form.admin_followup_questions || [];
        return (
            <div style={pageStyle}>
                <div style={cardStyle}>
                    <div style={{ padding: '40px 40px 24px', borderBottom: '1px solid #e2e8f0' }}>
                        <span style={eyebrowStyle}>{isEn ? 'Additional Questions' : 'Ek Sorular'}</span>
                        <h1 style={{ margin: '8px 0 12px', color: '#1a3a52', fontSize: 26 }}>
                            {isEn ? 'A few more questions for your strategy' : 'Stratejiniz için birkaç ek sorumuz var'}
                        </h1>
                        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                            {isEn
                                ? 'Our team needs more detail on a few points. Please answer below so we can finalize your strategic brief.'
                                : 'Ekibimiz birkaç noktada daha fazla detaya ihtiyaç duyuyor. Stratejik brifinizi tamamlayabilmemiz için aşağıdaki soruları cevaplayın.'}
                        </p>
                    </div>
                    <div style={{ padding: '28px 40px' }}>
                        {questions.map((q, idx) => (
                            <div key={q.id} style={{ marginBottom: 22 }}>
                                <label style={{ display: 'block', fontWeight: 600, color: '#1a3a52', marginBottom: 8, fontSize: 14 }}>
                                    {idx + 1}. {q.question}
                                </label>
                                <textarea
                                    rows={3}
                                    value={followupAnswers[q.id] || ''}
                                    onChange={e => setFollowupAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                    placeholder={isEn ? 'Your answer...' : 'Cevabınız...'}
                                    style={{ width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                                />
                            </div>
                        ))}
                        {submitMsg && (
                            <p style={{ color: submitMsg.startsWith('✓') ? '#22c55e' : '#dc2626', fontSize: 13, margin: '12px 0' }}>{submitMsg}</p>
                        )}
                        <button onClick={submitFollowup} disabled={submitting} style={{ ...btnPrimary, width: '100%', opacity: submitting ? 0.6 : 1 }}>
                            {submitting ? (isEn ? 'Submitting...' : 'Gönderiliyor...') : (isEn ? 'Submit Answers' : 'Cevapları Gönder')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // STATUS: approved → re-brief sunumu
    const userName = (user?.first_name || '').trim() || (isEn ? 'Friend' : 'Misafir');
    const rebrief = form.rebrief_data;
    const rebriefIntro = rebrief?.intro || form.admin_general_note || '';
    const rebriefSections = (rebrief?.sections || []).filter(s => (s.content || '').trim());

    return (
        <div style={pageStyle}>
            {/* Hero */}
            <section style={heroStyle}>
                <div style={{ maxWidth: 920, margin: '0 auto', padding: '60px 32px' }}>
                    <span style={{ ...eyebrowStyle, background: 'rgba(255,255,255,0.18)', color: '#fff' }}>
                        {isEn ? 'Strategic Brief' : 'Stratejik Brif'}
                    </span>
                    <h1 style={{ margin: '14px 0 8px', color: '#fff', fontSize: 'clamp(32px, 5vw, 48px)', lineHeight: 1.1, fontWeight: 800 }}>
                        {isEn ? `Hello ${userName},` : `Merhaba ${userName},`}
                    </h1>
                    {form.product_names && (
                        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 17, margin: '0 0 22px' }}>
                            {form.product_names}
                        </p>
                    )}
                    {rebriefIntro && (
                        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 14, padding: '24px 28px', marginTop: 24, color: '#102a43', boxShadow: '0 14px 40px rgba(0,0,0,0.18)' }}>
                            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                                {rebriefIntro}
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* Re-brief sections — admin'in hazırladığı strateji */}
            {rebriefSections.length > 0 && (
                <section style={{ padding: '50px 24px', maxWidth: 920, margin: '0 auto' }}>
                    <h2 style={{ color: '#1a3a52', fontSize: 24, margin: '0 0 28px', fontWeight: 800 }}>
                        {isEn ? 'Our Approach' : 'Önerimiz & Yol Haritamız'}
                    </h2>
                    <div style={{ display: 'grid', gap: 18 }}>
                        {rebriefSections.map((sec, idx) => (
                            <article key={sec.key} style={sectionCardStyle}>
                                <header style={{ marginBottom: 14 }}>
                                    <span style={sectionNumStyle}>
                                        {isEn ? `Section ${idx + 1}` : `Bölüm ${idx + 1}`}
                                    </span>
                                    <h3 style={{ margin: '4px 0 0', color: '#1a3a52', fontSize: 20, fontWeight: 700 }}>
                                        {sec.title}
                                    </h3>
                                </header>
                                <div style={{ color: '#102a43', fontSize: 15, lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                    {sec.content}
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            )}

            {/* Re-brief boşsa fallback (admin sadece intro yazmış olabilir) */}
            {rebriefSections.length === 0 && !rebriefIntro && (
                <section style={{ padding: '50px 24px', maxWidth: 920, margin: '0 auto', textAlign: 'center' }}>
                    <p style={{ color: '#64748b', fontSize: 15 }}>
                        {isEn
                            ? 'Your strategic brief is being finalized. Our team will share details soon.'
                            : 'Stratejik brifiniz son aşamada. Ekibimiz detayları kısa süre içinde paylaşacaktır.'}
                    </p>
                </section>
            )}

            {/* Footer */}
            <footer style={{ padding: '40px 24px', textAlign: 'center', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <p style={{ margin: '0 0 12px', color: '#475569', fontSize: 15 }}>
                    {isEn ? 'Have questions? Our team is here to help.' : 'Sorularınız mı var? Ekibimiz yardıma hazır.'}
                </p>
                <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: 13 }}>
                    <a href="mailto:info@khilon.com" style={{ color: '#1a3a52', fontWeight: 600 }}>info@khilon.com</a>
                    {' · +90 533 494 58 69'}
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => navigate(dashboardPath)} style={btnSecondary}>
                        {isEn ? 'Back to Dashboard' : 'Dashboard\'a Dön'}
                    </button>
                    <button onClick={() => navigate(homePath)} style={btnSecondary}>
                        {isEn ? 'Home' : 'Ana Sayfa'}
                    </button>
                </div>
            </footer>
        </div>
    );
}

// ─── Styles ────────────────────────────────────────────────
const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: '#f6f8fb',
    fontFamily: 'inherit',
    padding: '40px 0 0',
};

const cardStyle: React.CSSProperties = {
    maxWidth: 760,
    margin: '0 auto',
    background: '#fff',
    borderRadius: 14,
    boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
};

const heroStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #1a3a52 0%, #89b004 100%)',
    color: '#fff',
};

const eyebrowStyle: React.CSSProperties = {
    display: 'inline-block',
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    color: '#89b004',
    background: '#f4f9d6',
    padding: '5px 12px',
    borderRadius: 999,
};

const sectionCardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 14,
    border: '1px solid #e2e8f0',
    padding: '22px 24px',
    boxShadow: '0 4px 14px rgba(15,23,42,0.04)',
};

const sectionNumStyle: React.CSSProperties = {
    display: 'inline-block',
    fontSize: 11,
    fontWeight: 700,
    color: '#89b004',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
};

const btnPrimary: React.CSSProperties = {
    background: 'linear-gradient(135deg,#1a3a52,#89b004)',
    color: '#fff',
    border: 'none',
    padding: '13px 28px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 6px 18px rgba(26,58,82,0.15)',
};

const btnSecondary: React.CSSProperties = {
    background: '#fff',
    color: '#1a3a52',
    border: '1px solid #cbd5e1',
    padding: '11px 22px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
};
