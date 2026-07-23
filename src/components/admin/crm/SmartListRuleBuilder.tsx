import type { CrmListRule, CrmListRules } from '../../../services/api';
import { HiPlus, HiX } from 'react-icons/hi';

interface FieldDef {
    key: string;
    label: string;
    kind: 'text' | 'number' | 'date' | 'tag' | 'list' | 'select' | 'campaign';
    options?: string[];
}

const FIELDS: FieldDef[] = [
    { key: 'email', label: 'E-posta', kind: 'text' },
    { key: 'first_name', label: 'Ad', kind: 'text' },
    { key: 'last_name', label: 'Soyad', kind: 'text' },
    { key: 'phone', label: 'Telefon', kind: 'text' },
    { key: 'company', label: 'Firma', kind: 'text' },
    { key: 'status', label: 'Durum', kind: 'select', options: ['subscribed', 'unsubscribed', 'bounced', 'complained', 'pending'] },
    { key: 'source', label: 'Kaynak', kind: 'select', options: ['user_account', 'email_event', 'order', 'manual'] },
    { key: 'score', label: 'Skor', kind: 'number' },
    { key: 'ltv', label: 'LTV (Toplam Harcama)', kind: 'number' },
    { key: 'created_at', label: 'Eklenme Tarihi', kind: 'date' },
    { key: 'last_activity_at', label: 'Son Aktivite', kind: 'date' },
    { key: 'has_tag', label: 'Etiket Var', kind: 'tag' },
    { key: 'in_list', label: 'Liste Üyesi', kind: 'list' },
    { key: 'opened_campaign', label: 'Kampanya Açtı', kind: 'campaign' },
    { key: 'clicked_campaign', label: 'Kampanyada Tıkladı (tüm linkler)', kind: 'campaign' },
    // Yalnızca İÇERİK linkleri: abonelikten çık, sosyal medya, KVKK ve mailto tıklamaları
    // hariç tutulur (hariç kalıplar: Ayarlar > crm_click_exclude_patterns).
    // Footer linkleri kurumsal mail güvenlik tarayıcıları (bot) tarafından da çok tıklandığı
    // için bu kural aynı zamanda bot gürültüsünü temizler → gerçek ilgi.
    { key: 'clicked_link_campaign', label: 'Kampanyada İçerik Linkine Tıkladı (önerilen)', kind: 'campaign' },
];

const OPS_BY_KIND: Record<FieldDef['kind'], { value: string; label: string; needsValue?: boolean }[]> = {
    text: [
        { value: 'equals', label: 'eşittir' },
        { value: 'not_equals', label: 'eşit değil' },
        { value: 'contains', label: 'içeriyor' },
        { value: 'not_contains', label: 'içermiyor' },
        { value: 'starts_with', label: 'başlıyor' },
        { value: 'ends_with', label: 'bitiyor' },
        { value: 'is_empty', label: 'boş', needsValue: false },
        { value: 'is_not_empty', label: 'dolu', needsValue: false },
    ],
    number: [
        { value: 'equals', label: '=' },
        { value: 'gt', label: '>' },
        { value: 'gte', label: '≥' },
        { value: 'lt', label: '<' },
        { value: 'lte', label: '≤' },
        { value: 'between', label: 'arasında' },
    ],
    date: [
        { value: 'within_days', label: 'son N günde' },
        { value: 'older_than_days', label: 'N günden eski' },
        { value: 'is_null', label: 'hiç olmadı', needsValue: false },
        { value: 'is_not_null', label: 'oldu', needsValue: false },
    ],
    tag: [
        { value: 'equals', label: 'var' },
        { value: 'not_equals', label: 'yok' },
    ],
    list: [
        { value: 'equals', label: 'üye' },
        { value: 'not_equals', label: 'üye değil' },
    ],
    select: [
        { value: 'equals', label: '=' },
        { value: 'not_equals', label: '≠' },
    ],
    campaign: [
        { value: 'equals', label: 'açtı' },
        { value: 'not_equals', label: 'açmadı' },
        { value: 'any', label: 'herhangi birini açtı', needsValue: false },
    ],
};

interface Props {
    value: CrmListRules;
    onChange: (rules: CrmListRules) => void;
    availableTags?: { slug: string; name: string }[];
    availableLists?: { id: number; name: string }[];
    availableCampaigns?: { id: number; name: string }[];
}

export default function SmartListRuleBuilder({ value, onChange, availableTags = [], availableLists = [], availableCampaigns = [] }: Props) {
    const updateRule = (idx: number, patch: Partial<CrmListRule>) => {
        const next = [...value.rules];
        next[idx] = { ...next[idx], ...patch };
        onChange({ ...value, rules: next });
    };
    const addRule = () => {
        onChange({ ...value, rules: [...value.rules, { field: 'email', op: 'contains', value: '' }] });
    };
    const removeRule = (idx: number) => {
        onChange({ ...value, rules: value.rules.filter((_, i) => i !== idx) });
    };

    return (
        <div className="rule-builder">
            <div className="rule-builder-header">
                <span className="rule-builder-label">Kişiler şu kuralların</span>
                <select value={value.match} onChange={(e) => onChange({ ...value, match: e.target.value as 'all' | 'any' })}>
                    <option value="all">tümünü</option>
                    <option value="any">en az birini</option>
                </select>
                <span className="rule-builder-label">karşılarsa</span>
            </div>

            <div className="rule-list">
                {value.rules.length === 0 && (
                    <div className="rule-empty">Henüz kural yok. "Kural Ekle" ile başlayın.</div>
                )}
                {value.rules.map((r, idx) => {
                    const field = FIELDS.find(f => f.key === r.field) || FIELDS[0];
                    const ops = OPS_BY_KIND[field.kind];
                    const opDef = ops.find(o => o.value === r.op);
                    const needsValue = opDef?.needsValue !== false;

                    return (
                        <div key={idx} className="rule-row">
                            <select
                                value={r.field}
                                onChange={(e) => {
                                    const newField = FIELDS.find(f => f.key === e.target.value)!;
                                    const firstOp = OPS_BY_KIND[newField.kind][0].value;
                                    updateRule(idx, { field: e.target.value, op: firstOp, value: '' });
                                }}
                            >
                                {FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                            </select>

                            <select value={r.op} onChange={(e) => updateRule(idx, { op: e.target.value })}>
                                {ops.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>

                            {needsValue && (
                                <ValueInput
                                    field={field}
                                    op={r.op}
                                    value={r.value}
                                    onChange={(v) => updateRule(idx, { value: v })}
                                    availableTags={availableTags}
                                    availableLists={availableLists}
                                    availableCampaigns={availableCampaigns}
                                />
                            )}

                            <button className="rule-remove" onClick={() => removeRule(idx)} title="Sil"><HiX /></button>
                        </div>
                    );
                })}
            </div>

            <button className="rule-add-btn" onClick={addRule}>
                <HiPlus /> Kural Ekle
            </button>

            <style>{`
                .rule-builder { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
                .rule-builder-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
                .rule-builder-label { font-size: 14px; color: #475569; }
                .rule-builder-header select { padding: 5px 10px; border: 1px solid #cbd5e1; border-radius: 6px; background: white; font-weight: 600; }
                .rule-list { display: flex; flex-direction: column; gap: 8px; }
                .rule-empty { padding: 14px; text-align: center; color: #94a3b8; font-style: italic; font-size: 13px; }
                .rule-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; padding: 8px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; }
                .rule-row select, .rule-row input { padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; }
                .rule-row .rule-value { flex: 1; min-width: 140px; }
                .rule-remove { background: none; border: none; color: #94a3b8; cursor: pointer; padding: 4px 6px; }
                .rule-remove:hover { color: #dc2626; }
                .rule-add-btn { margin-top: 10px; background: white; border: 1px dashed #cbd5e1; padding: 8px 14px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #2563eb; }
                .rule-add-btn:hover { border-color: #2563eb; background: #eff6ff; }
                .between-pair { display: flex; gap: 6px; }
                .between-pair input { width: 80px; }
            `}</style>
        </div>
    );
}

function ValueInput({ field, op, value, onChange, availableTags, availableLists, availableCampaigns }: {
    field: FieldDef;
    op: string;
    value: unknown;
    onChange: (v: unknown) => void;
    availableTags: { slug: string; name: string }[];
    availableLists: { id: number; name: string }[];
    availableCampaigns: { id: number; name: string }[];
}) {
    if (field.kind === 'campaign') {
        return (
            <select className="rule-value" value={String(value || '')} onChange={(e) => onChange(Number(e.target.value))}>
                <option value="">— Kampanya seç —</option>
                {availableCampaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
        );
    }
    if (field.kind === 'tag') {
        return (
            <select className="rule-value" value={String(value || '')} onChange={(e) => onChange(e.target.value)}>
                <option value="">— Etiket seç —</option>
                {availableTags.map(t => <option key={t.slug} value={t.slug}>{t.name}</option>)}
            </select>
        );
    }
    if (field.kind === 'list') {
        return (
            <select className="rule-value" value={String(value || '')} onChange={(e) => onChange(Number(e.target.value))}>
                <option value="">— Liste seç —</option>
                {availableLists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
        );
    }
    if (field.kind === 'select') {
        return (
            <select className="rule-value" value={String(value || '')} onChange={(e) => onChange(e.target.value)}>
                <option value="">—</option>
                {(field.options || []).map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        );
    }
    if (field.kind === 'number' && op === 'between') {
        const arr = Array.isArray(value) ? value : ['', ''];
        return (
            <div className="between-pair">
                <input type="number" placeholder="min" value={String(arr[0] ?? '')} onChange={(e) => onChange([e.target.value, arr[1]])} />
                <input type="number" placeholder="max" value={String(arr[1] ?? '')} onChange={(e) => onChange([arr[0], e.target.value])} />
            </div>
        );
    }
    if (field.kind === 'number') {
        return <input className="rule-value" type="number" value={String(value || '')} onChange={(e) => onChange(e.target.value)} />;
    }
    if (field.kind === 'date') {
        return <input className="rule-value" type="number" min={1} placeholder="gün" value={String(value || '')} onChange={(e) => onChange(Number(e.target.value))} />;
    }
    return <input className="rule-value" type="text" value={String(value || '')} onChange={(e) => onChange(e.target.value)} placeholder="değer..." />;
}
