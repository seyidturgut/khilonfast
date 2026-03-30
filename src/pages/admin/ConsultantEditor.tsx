import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { HiPlus, HiTrash, HiPencil, HiX } from 'react-icons/hi';

const ADMIN_API_BASE = import.meta.env.VITE_API_URL || '/api';

const ALL_SECTORS = [
    { slug: 'fintech', label: 'FinTech', icon: '💳' },
    { slug: 'odeme-sistemleri', label: 'Ödeme Sistemleri', icon: '🏦' },
    { slug: 'teknoloji-yazilim', label: 'Teknoloji / Yazılım', icon: '💻' },
    { slug: 'b2b', label: 'B2B', icon: '🤝' },
    { slug: 'filo-kiralama', label: 'Filo Kiralama', icon: '🚗' },
    { slug: 'enerji', label: 'Enerji', icon: '⚡' },
    { slug: 'uretim', label: 'Üretim', icon: '🏭' },
    { slug: 'ic-tasarim', label: 'İç Tasarım', icon: '🏢' },
    { slug: 'endustriyel-gida', label: 'Endüstriyel Gıda', icon: '🍽️' },
];

const CATEGORIES = [
    { value: 'hizli', label: 'Hızlı Danışmanlık', color: '#e3f2fd', text: '#1565c0' },
    { value: 'strateji', label: 'Strateji Çalışması', color: '#e8f5e9', text: '#2e7d32' },
    { value: 'ust_duzey', label: 'Üst Düzey', color: '#f3e5f5', text: '#6a1b9a' },
];

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
    available: { bg: '#e8f5e9', color: '#2e7d32', label: 'Müsait' },
    held: { bg: '#fff3e0', color: '#e65100', label: 'Rezerve (Hold)' },
    booked: { bg: '#e3f2fd', color: '#1565c0', label: 'Dolu' },
};

type TabKey = 'info' | 'services' | 'availability';

interface ServiceForm {
    id?: number;
    category: string;
    parent_service_id: string;
    title: string;
    description: string;
    scope_items: string[];
    duration_text: string;
    sessions_text: string;
    price: number;
    currency: string;
    plus_vat: boolean;
    cta_text: string;
    badge_text: string;
    sort_order: number;
    is_active: boolean;
}

const emptyService = (): ServiceForm => ({
    category: 'hizli', parent_service_id: '', title: '', description: '',
    scope_items: [], duration_text: '', sessions_text: '',
    price: 0, currency: 'TRY', plus_vat: true,
    cta_text: '', badge_text: '', sort_order: 0, is_active: true,
});

function slugify(text: string) {
    return text.toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// ── Styles ──────────────────────────────────────────────────────────────
const S = {
    page: { padding: '28px', maxWidth: 960 } as React.CSSProperties,
    card: { background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '24px', marginBottom: 20 } as React.CSSProperties,
    sectionTitle: { fontSize: '0.95rem', fontWeight: 700, color: '#1e3a5f', marginBottom: 16, marginTop: 0, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' } as React.CSSProperties,
    label: { fontSize: '0.78rem', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.03em' },
    input: { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.92rem', outline: 'none', boxSizing: 'border-box' as const },
    textarea: { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.92rem', outline: 'none', resize: 'vertical' as const, boxSizing: 'border-box' as const },
    select: { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.92rem', outline: 'none', background: '#fff', boxSizing: 'border-box' as const },
    btnPrimary: { background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 } as React.CSSProperties,
    btnDanger: { background: 'none', border: '1px solid #fca5a5', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4 } as React.CSSProperties,
    btnGhost: { background: 'none', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: '0.85rem', color: '#374151', display: 'flex', alignItems: 'center', gap: 6 } as React.CSSProperties,
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 } as React.CSSProperties,
    grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 } as React.CSSProperties,
    grid4: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 } as React.CSSProperties,
};

// ── Scope Items Editor ───────────────────────────────────────────────────
function ScopeEditor({ items, onChange }: { items: string[]; onChange: (v: string[]) => void }) {
    const [draft, setDraft] = useState('');
    const add = () => {
        if (!draft.trim()) return;
        onChange([...items, draft.trim()]);
        setDraft('');
    };
    return (
        <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                {items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8faff', border: '1px solid #e5e7eb', borderRadius: 7, padding: '6px 10px' }}>
                        <span style={{ flex: 1, fontSize: '0.88rem' }}>✓ {item}</span>
                        <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '0.9rem' }}>×</button>
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
                <input style={{ ...S.input, flex: 1 }} value={draft} placeholder="Madde ekle ve Enter'a bas..."
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
                <button type="button" onClick={add} style={{ ...S.btnPrimary, padding: '8px 14px' }}>
                    <HiPlus />
                </button>
            </div>
        </div>
    );
}

// ── Service Form ─────────────────────────────────────────────────────────
function ServiceFormPanel({
    form, setForm, onSave, onCancel, saving, parentServices, isEdit
}: {
    form: ServiceForm; setForm: (f: ServiceForm) => void;
    onSave: () => void; onCancel: () => void;
    saving: boolean; parentServices: any[]; isEdit: boolean;
}) {
    return (
        <div style={{ background: '#f8faff', border: '1.5px solid #c7d7f0', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h4 style={{ margin: 0, color: '#1e3a5f', fontSize: '0.95rem' }}>{isEdit ? '✏️ Hizmet Düzenle' : '+ Yeni Hizmet'}</h4>
            <div style={S.grid2}>
                <div>
                    <label style={S.label}>Kategori *</label>
                    <select style={S.select} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                </div>
                <div>
                    <label style={S.label}>Üst Hizmet (Alt Paket için)</label>
                    <select style={S.select} value={form.parent_service_id} onChange={e => setForm({ ...form, parent_service_id: e.target.value })}>
                        <option value="">— Bağımsız Hizmet —</option>
                        {parentServices.filter(s => s.category === 'ust_duzey' && !s.parent_service_id).map(s => (
                            <option key={s.id} value={String(s.id)}>{s.title}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div style={S.grid2}>
                <div>
                    <label style={S.label}>Başlık *</label>
                    <input style={S.input} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Strategy Mentoring Session" />
                </div>
                <div>
                    <label style={S.label}>Rozet (opsiyonel)</label>
                    <input style={S.input} value={form.badge_text} onChange={e => setForm({ ...form, badge_text: e.target.value })} placeholder="⭐ Most Preferred" />
                </div>
            </div>
            <div>
                <label style={S.label}>Açıklama</label>
                <textarea rows={2} style={S.textarea} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="60 Dakikalık Strateji Mentorluk" />
            </div>
            <div>
                <label style={S.label}>Kapsam Maddeleri</label>
                <ScopeEditor items={form.scope_items} onChange={v => setForm({ ...form, scope_items: v })} />
            </div>
            <div style={S.grid4}>
                <div>
                    <label style={S.label}>Fiyat *</label>
                    <input type="number" style={S.input} value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                    <label style={S.label}>Para Birimi</label>
                    <select style={S.select} value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
                        <option>TRY</option><option>USD</option><option>EUR</option>
                    </select>
                </div>
                <div>
                    <label style={S.label}>Süre</label>
                    <input style={S.input} value={form.duration_text} onChange={e => setForm({ ...form, duration_text: e.target.value })} placeholder="60 dk" />
                </div>
                <div>
                    <label style={S.label}>Seans</label>
                    <input style={S.input} value={form.sessions_text} onChange={e => setForm({ ...form, sessions_text: e.target.value })} placeholder="x3 seans" />
                </div>
            </div>
            <div style={S.grid2}>
                <div>
                    <label style={S.label}>CTA Butonu</label>
                    <input style={S.input} value={form.cta_text} onChange={e => setForm({ ...form, cta_text: e.target.value })} placeholder="Seans Planla" />
                </div>
                <div>
                    <label style={S.label}>Sıra</label>
                    <input type="number" style={S.input} value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
                </div>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.plus_vat} onChange={e => setForm({ ...form, plus_vat: e.target.checked })} />
                    + KDV
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                    Aktif
                </label>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={onSave} disabled={saving} style={S.btnPrimary}>
                    {saving ? 'Kaydediliyor...' : isEdit ? '✓ Güncelle' : '+ Hizmet Ekle'}
                </button>
                <button onClick={onCancel} style={S.btnGhost}><HiX /> İptal</button>
            </div>
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────────────────
export default function ConsultantEditor() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isNew = id === 'new' || !id;
    const [tab, setTab] = useState<TabKey>('info');
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    // ── Info ──
    const [form, setForm] = useState({
        slug: '', name: '', title: '', bio: '', photo_url: '',
        stars: 5.0, review_count: 0, sectors: [] as string[], is_active: 1,
        ical_url: '', ical_sync_enabled: 0
    });
    const [icalSyncing, setIcalSyncing] = useState(false);
    const [icalMsg, setIcalMsg] = useState('');
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    // ── Services ──
    const [services, setServices] = useState<any[]>([]);
    const [showServiceForm, setShowServiceForm] = useState(false);
    const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
    const [serviceForm, setServiceForm] = useState<ServiceForm>(emptyService());
    const [savingService, setSavingService] = useState(false);

    // ── Availability ──
    const [slots, setSlots] = useState<any[]>([]);
    const [slotDate, setSlotDate] = useState('');
    const [slotTimes, setSlotTimes] = useState([{ start: '09:00', end: '10:00' }]);
    const [addingSlots, setAddingSlots] = useState(false);

    const token = () => localStorage.getItem('token') || '';
    const authHeaders = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

    // ── Fetch ──
    useEffect(() => {
        if (isNew) return;
        fetch(`${ADMIN_API_BASE}/admin/consultants`, { headers: authHeaders() })
            .then(r => r.json())
            .then(data => {
                const c = (data.consultants || []).find((x: any) => String(x.id) === id);
                if (!c) return;
                setForm({
                    slug: c.slug, name: c.name, title: c.title || '', bio: c.bio || '',
                    photo_url: c.photo_url || '', stars: parseFloat(c.stars) || 5.0,
                    review_count: c.review_count || 0, is_active: c.is_active,
                    sectors: Array.isArray(c.sectors) ? c.sectors
                        : (typeof c.sectors === 'string' ? (() => { try { return JSON.parse(c.sectors); } catch { return []; } })() : []),
                    ical_url: c.ical_url || '',
                    ical_sync_enabled: c.ical_sync_enabled ? 1 : 0,
                });
            });
        fetchServices();
        fetchSlots();
    }, [id]);

    const fetchServices = () => {
        if (isNew) return;
        fetch(`${ADMIN_API_BASE}/admin/consultants/${id}/services`, { headers: authHeaders() })
            .then(r => r.json())
            .then(d => setServices(d.services || []));
    };

    const fetchSlots = () => {
        if (isNew) return;
        fetch(`${ADMIN_API_BASE}/admin/consultants/${id}/availability`, { headers: authHeaders() })
            .then(r => r.json())
            .then(d => setSlots(d.slots || []));
    };

    // ── Save info ──
    const saveInfo = async () => {
        if (!form.name || !form.slug) { setMsg('İsim ve slug zorunlu!'); return; }
        setSaving(true); setMsg('');
        try {
            if (isNew) {
                const res = await fetch(`${ADMIN_API_BASE}/admin/consultants`, {
                    method: 'POST', headers: authHeaders(), body: JSON.stringify(form)
                });
                const data = await res.json();
                if (data.id) { setMsg('Danışman oluşturuldu!'); navigate(`/admin/consultants/${data.id}`); }
                else setMsg('Hata: ' + (data.error || 'Bilinmeyen hata'));
            } else {
                const res = await fetch(`${ADMIN_API_BASE}/admin/consultants/${id}`, {
                    method: 'PUT', headers: authHeaders(), body: JSON.stringify(form)
                });
                if (res.ok) setMsg('✓ Kaydedildi');
                else setMsg('Hata oluştu!');
            }
        } catch { setMsg('Bağlantı hatası!'); }
        setSaving(false);
    };

    // ── Photo upload ──
    const handlePhotoUpload = async (file: File) => {
        setUploadingPhoto(true);
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const res = await fetch(`${ADMIN_API_BASE}/admin/media/upload-base64`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token()}`
                    },
                    body: JSON.stringify({
                        dataUrl: String(reader.result || ''),
                        filename: `consultant-${form.slug || 'profile'}`
                    })
                });
                
                if (!res.ok) {
                    setMsg('Fotoğraf yüklenemedi!');
                    setUploadingPhoto(false);
                    return;
                }
                
                const data = await res.json();
                if (data.path) {
                    setForm(f => ({ ...f, photo_url: data.path }));
                    setMsg('✓ Fotoğraf yüklendi (Kaydetmeyi unutmayın)');
                } else {
                    setMsg('Yükleme hatası: URL alınamadı');
                }
            } catch (err) {
                console.error('Upload error:', err);
                setMsg('Bağlantı hatası!');
            } finally {
                setUploadingPhoto(false);
            }
        };
        reader.readAsDataURL(file);
    };

    // ── Service CRUD ──
    const openAddService = () => {
        setEditingServiceId(null);
        setServiceForm(emptyService());
        setShowServiceForm(true);
    };

    const openEditService = (s: any) => {
        setEditingServiceId(s.id);
        const scopeItems = Array.isArray(s.scope_items) ? s.scope_items
            : (typeof s.scope_items === 'string' ? (() => { try { return JSON.parse(s.scope_items); } catch { return s.scope_items ? [s.scope_items] : []; } })() : []);
        setServiceForm({
            id: s.id, category: s.category, parent_service_id: s.parent_service_id ? String(s.parent_service_id) : '',
            title: s.title, description: s.description || '', scope_items: scopeItems,
            duration_text: s.duration_text || '', sessions_text: s.sessions_text || '',
            price: parseFloat(s.price) || 0, currency: s.currency || 'TRY',
            plus_vat: Boolean(s.plus_vat), cta_text: s.cta_text || '',
            badge_text: s.badge_text || '', sort_order: s.sort_order || 0, is_active: Boolean(s.is_active),
        });
        setShowServiceForm(true);
    };

    const saveService = async () => {
        if (!serviceForm.title) return;
        setSavingService(true);
        const body = {
            ...serviceForm,
            parent_service_id: serviceForm.parent_service_id ? parseInt(serviceForm.parent_service_id) : null,
            scope_items: JSON.stringify(serviceForm.scope_items),
        };
        if (editingServiceId) {
            await fetch(`${ADMIN_API_BASE}/admin/consultant-services/${editingServiceId}`, {
                method: 'PUT', headers: authHeaders(), body: JSON.stringify(body)
            });
        } else {
            await fetch(`${ADMIN_API_BASE}/admin/consultants/${id}/services`, {
                method: 'POST', headers: authHeaders(), body: JSON.stringify(body)
            });
        }
        setSavingService(false);
        setShowServiceForm(false);
        setEditingServiceId(null);
        fetchServices();
    };

    const deleteService = async (sid: number) => {
        if (!confirm('Bu hizmeti silmek istiyor musunuz?')) return;
        await fetch(`${ADMIN_API_BASE}/admin/consultant-services/${sid}`, { method: 'DELETE', headers: authHeaders() });
        fetchServices();
    };

    // ── Slot management ──
    const addSlotTime = () => setSlotTimes(t => [...t, { start: '09:00', end: '10:00' }]);
    const removeSlotTime = (i: number) => setSlotTimes(t => t.filter((_, j) => j !== i));
    const updateSlotTime = (i: number, field: 'start' | 'end', val: string) => {
        setSlotTimes(t => t.map((s, j) => j === i ? { ...s, [field]: val } : s));
    };

    const addSlots = async () => {
        if (!slotDate) return;
        setAddingSlots(true);
        const slotsPayload = slotTimes.map(t => ({ available_date: slotDate, start_time: t.start, end_time: t.end }));
        await fetch(`${ADMIN_API_BASE}/admin/consultants/${id}/availability`, {
            method: 'POST', headers: authHeaders(), body: JSON.stringify({ slots: slotsPayload })
        });
        setSlotDate('');
        setSlotTimes([{ start: '09:00', end: '10:00' }]);
        setAddingSlots(false);
        fetchSlots();
    };

    const deleteSlot = async (sid: number, status: string) => {
        if (status !== 'available') {
            const makeAvailable = confirm('Bu slot rezerve veya dolu görünüyor. Tamamen silmek yerine sadece BOŞ (MÜSAİT) duruma mı getirmek istersiniz? \n\n(Tamam derseniz SAAT KALIR ama müsait olur, İptal derseniz SİLME adımına geçilir)');
            if (makeAvailable) {
                await fetch(`${ADMIN_API_BASE}/admin/availability/${sid}`, { 
                    method: 'PATCH', 
                    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'available' })
                });
                return fetchSlots();
            }
        }

        if (confirm('Bu saati takvimden TAMAMEN SİLMEK istediğinize emin misiniz?')) {
            await fetch(`${ADMIN_API_BASE}/admin/availability/${sid}`, { method: 'DELETE', headers: authHeaders() });
            fetchSlots();
        }
    };

    // ── iCal sync ──
    const syncIcal = async () => {
        setIcalSyncing(true);
        setIcalMsg('');
        try {
            const res = await fetch(`${ADMIN_API_BASE}/admin/sync-calendar/${id}`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ ical_url: form.ical_url })
            });
            const text = await res.text();
            let data: any;
            try { data = JSON.parse(text); } catch { setIcalMsg(`Sunucu hatası (${res.status}): ${text.slice(0, 200)}`); setIcalSyncing(false); return; }
            if (data.error) setIcalMsg(`Hata: ${data.error}`);
            else setIcalMsg(`✓ ${data.added} slot eklendi, ${data.removed} slot silindi`);
            fetchSlots();
        } catch (e: any) { setIcalMsg(`Bağlantı hatası: ${e?.message || e}`); }
        setIcalSyncing(false);
    };

    // ── Sector toggle ──
    const toggleSector = (slug: string) => {
        setForm(f => ({
            ...f, sectors: f.sectors.includes(slug)
                ? f.sectors.filter(s => s !== slug)
                : [...f.sectors, slug]
        }));
    };

    // ── Group slots by date ──
    const slotsByDate = slots.reduce((acc: Record<string, any[]>, s) => {
        const dateKey = s.available_date && s.available_date.includes('T') ? s.available_date.split('T')[0] : s.available_date;
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(s);
        return acc;
    }, {});

    // ── Tab style ──
    const tabBtn = (key: TabKey) => ({
        padding: '10px 22px', cursor: 'pointer', border: 'none', background: 'none',
        borderBottom: tab === key ? '2px solid #1e3a5f' : '2px solid transparent',
        color: tab === key ? '#1e3a5f' : '#6b7280',
        fontWeight: tab === key ? 700 : 400, fontSize: '0.9rem',
    } as React.CSSProperties);

    // ── Render ───────────────────────────────────────────────────────────
    return (
        <AdminLayout>
            <div style={S.page}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Link to="/admin/consultants" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.85rem' }}>← Danışmanlar</Link>
                        <span style={{ color: '#d1d5db' }}>|</span>
                        <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#1e3a5f' }}>
                            {isNew ? 'Yeni Danışman Ekle' : form.name || 'Danışman Düzenle'}
                        </h1>
                    </div>
                    {!isNew && (
                        <a href={`/danismanlar/${form.slug}`} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: '0.82rem', color: '#6b7280', textDecoration: 'underline' }}>
                            Sayfayı Görüntüle ↗
                        </a>
                    )}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '2px solid #f0f0f0', marginBottom: 24 }}>
                    <button style={tabBtn('info')} onClick={() => setTab('info')}>📋 Genel Bilgiler</button>
                    {!isNew && <button style={tabBtn('services')} onClick={() => setTab('services')}>
                        🛠 Hizmetler {services.length > 0 && <span style={{ background: '#e3f2fd', color: '#1565c0', borderRadius: 10, padding: '0 6px', fontSize: '0.75rem', marginLeft: 4 }}>{services.length}</span>}
                    </button>}
                    {!isNew && <button style={tabBtn('availability')} onClick={() => setTab('availability')}>
                        📅 Takvim {slots.length > 0 && <span style={{ background: '#e8f5e9', color: '#2e7d32', borderRadius: 10, padding: '0 6px', fontSize: '0.75rem', marginLeft: 4 }}>{slots.length}</span>}
                    </button>}
                </div>

                {/* ═══════════════════════════════════════════
                    TAB 1 — GENEL BİLGİLER
                ═══════════════════════════════════════════ */}
                {tab === 'info' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                        {/* Kimlik */}
                        <div style={S.card}>
                            <h3 style={S.sectionTitle}>Kimlik Bilgileri</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div style={S.grid2}>
                                    <div>
                                        <label style={S.label}>İsim Soyisim *</label>
                                        <input style={S.input} value={form.name}
                                            onChange={e => setForm(f => ({
                                                ...f, name: e.target.value,
                                                slug: f.slug || slugify(e.target.value)
                                            }))} placeholder="Bora Işık" />
                                    </div>
                                    <div>
                                        <label style={S.label}>URL Slug *</label>
                                        <input style={S.input} value={form.slug}
                                            onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                                            placeholder="bora-isik" />
                                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>/danismanlar/{form.slug || '...'}</span>
                                    </div>
                                </div>
                                <div>
                                    <label style={S.label}>Unvan / Uzmanlık</label>
                                    <input style={S.input} value={form.title}
                                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                        placeholder="Growth Marketing & Fractional CMO Uzmanı" />
                                </div>
                                <div>
                                    <label style={S.label}>Biyografi</label>
                                    <textarea rows={4} style={S.textarea} value={form.bio}
                                        onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                                        placeholder="Danışmanın deneyim ve uzmanlık alanlarını anlatan kısa biyografi..." />
                                </div>
                            </div>
                        </div>

                        {/* Fotoğraf */}
                        <div style={S.card}>
                            <h3 style={S.sectionTitle}>Profil Fotoğrafı</h3>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
                                <div style={{ flexShrink: 0 }}>
                                    {form.photo_url ? (
                                        <img src={form.photo_url} alt="Profil"
                                            style={{ width: 100, height: 100, borderRadius: 12, objectFit: 'cover', border: '2px solid #e5e7eb' }} />
                                    ) : (
                                        <div style={{ width: 100, height: 100, borderRadius: 12, background: 'linear-gradient(135deg, #d4f04d, #a8c938)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: '#1e3a5f' }}>
                                            {form.name ? form.name.split(' ').map(w => w[0]).slice(0, 2).join('') : '?'}
                                        </div>
                                    )}
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                                        onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }} />
                                    <button onClick={() => fileRef.current?.click()}
                                        style={{ ...S.btnGhost, width: 'fit-content' }}
                                        disabled={uploadingPhoto}>
                                        {uploadingPhoto ? '⏳ Yükleniyor...' : '📸 Fotoğraf Yükle'}
                                    </button>
                                    <input style={{ ...S.input, fontSize: '0.82rem' }} value={form.photo_url}
                                        onChange={e => setForm(f => ({ ...f, photo_url: e.target.value }))}
                                        placeholder="veya fotoğraf URL'si girin..." />
                                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>JPG, PNG veya WebP. Kare format önerilir.</span>
                                </div>
                            </div>
                        </div>

                        {/* Sektörler */}
                        <div style={S.card}>
                            <h3 style={S.sectionTitle}>Uzmanlık Sektörleri</h3>
                            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0 0 14px' }}>
                                Danışmanın hizmet verdiği sektörleri seçin. Bu bilgi profil sayfasında ve sektör bazlı filtrelemede kullanılır.
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                {ALL_SECTORS.map(s => {
                                    const active = form.sectors.includes(s.slug);
                                    return (
                                        <button key={s.slug} type="button" onClick={() => toggleSector(s.slug)}
                                            style={{
                                                padding: '8px 16px', borderRadius: 999, cursor: 'pointer', fontSize: '0.88rem',
                                                fontWeight: active ? 700 : 400, transition: 'all 0.15s',
                                                background: active ? '#1e3a5f' : '#f3f4f6',
                                                color: active ? '#fff' : '#374151',
                                                border: active ? '1.5px solid #1e3a5f' : '1.5px solid #e5e7eb',
                                            }}>
                                            {s.icon} {s.label}
                                            {active && ' ✓'}
                                        </button>
                                    );
                                })}
                            </div>
                            {form.sectors.length > 0 && (
                                <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 10 }}>
                                    {form.sectors.length} sektör seçildi: {form.sectors.map(sl => ALL_SECTORS.find(s => s.slug === sl)?.label).join(', ')}
                                </p>
                            )}
                        </div>

                        {/* Puanlama & Durum */}
                        <div style={S.card}>
                            <h3 style={S.sectionTitle}>Puanlama & Durum</h3>
                            <div style={S.grid3}>
                                <div>
                                    <label style={S.label}>Yıldız Puanı (1-5)</label>
                                    <input type="number" min={1} max={5} step={0.1} style={S.input} value={form.stars}
                                        onChange={e => setForm(f => ({ ...f, stars: parseFloat(e.target.value) }))} />
                                </div>
                                <div>
                                    <label style={S.label}>Değerlendirme Sayısı</label>
                                    <input type="number" min={0} style={S.input} value={form.review_count}
                                        onChange={e => setForm(f => ({ ...f, review_count: parseInt(e.target.value) || 0 }))} />
                                </div>
                                <div>
                                    <label style={S.label}>Yayın Durumu</label>
                                    <select style={S.select} value={form.is_active}
                                        onChange={e => setForm(f => ({ ...f, is_active: parseInt(e.target.value) }))}>
                                        <option value={1}>✅ Aktif — Sitede Görünür</option>
                                        <option value={0}>🔒 Pasif — Gizli</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Save */}
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <button onClick={saveInfo} disabled={saving} style={{ ...S.btnPrimary, fontSize: '1rem', padding: '12px 28px' }}>
                                {saving ? '⏳ Kaydediliyor...' : isNew ? '🚀 Danışman Oluştur' : '💾 Değişiklikleri Kaydet'}
                            </button>
                            {msg && (
                                <span style={{ color: msg.includes('Hata') || msg.includes('zorunlu') ? '#dc2626' : '#16a34a', fontSize: '0.9rem', fontWeight: 600 }}>
                                    {msg}
                                </span>
                            )}
                        </div>

                        {isNew && (
                            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 14 }}>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e' }}>
                                    💡 <strong>Not:</strong> Danışman oluşturulduktan sonra Hizmetler ve Takvim sekmeleri açılacaktır.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══════════════════════════════════════════
                    TAB 2 — HİZMETLER
                ═══════════════════════════════════════════ */}
                {tab === 'services' && (
                    <div>
                        {/* Mevcut hizmetler — kategoriye göre gruplu */}
                        {CATEGORIES.map(cat => {
                            const catServices = services.filter(s => s.category === cat.value);
                            if (!catServices.length && !showServiceForm) return null;
                            return (
                                <div key={cat.value} style={{ marginBottom: 24 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                        <span style={{ background: cat.color, color: cat.text, padding: '3px 12px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 700 }}>
                                            {cat.label}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{catServices.length} hizmet</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {catServices.map(s => {
                                            const scopeItems = Array.isArray(s.scope_items) ? s.scope_items
                                                : (typeof s.scope_items === 'string' ? (() => { try { return JSON.parse(s.scope_items); } catch { return []; } })() : []);
                                            return (
                                                <div key={s.id} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                                <strong style={{ fontSize: '0.95rem' }}>{s.title}</strong>
                                                                {s.parent_service_id && <span style={{ background: '#f3e5f5', color: '#6a1b9a', fontSize: '0.72rem', padding: '1px 8px', borderRadius: 10 }}>alt paket</span>}
                                                                {s.badge_text && <span style={{ background: '#fff3e0', color: '#e65100', fontSize: '0.72rem', padding: '1px 8px', borderRadius: 10 }}>{s.badge_text}</span>}
                                                                {!s.is_active && <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.72rem', padding: '1px 8px', borderRadius: 10 }}>pasif</span>}
                                                            </div>
                                                            <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                                                <span>💰 {parseFloat(s.price).toLocaleString('tr-TR')} {s.currency}{s.plus_vat ? ' + KDV' : ''}</span>
                                                                {s.duration_text && <span>⏱ {s.duration_text}</span>}
                                                                {s.sessions_text && <span>📅 {s.sessions_text}</span>}
                                                                {scopeItems.length > 0 && <span>✓ {scopeItems.length} madde</span>}
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 6, marginLeft: 12 }}>
                                                            <button onClick={() => openEditService(s)} style={{ ...S.btnGhost, padding: '5px 10px', fontSize: '0.82rem' }}>
                                                                <HiPencil /> Düzenle
                                                            </button>
                                                            <button onClick={() => deleteService(s.id)} style={S.btnDanger}>
                                                                <HiTrash />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                        {services.length === 0 && !showServiceForm && (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af', background: '#f9fafb', borderRadius: 12, marginBottom: 20 }}>
                                <p style={{ fontSize: '1.5rem', margin: '0 0 8px' }}>🛠</p>
                                <p style={{ margin: 0 }}>Henüz hizmet eklenmemiş. İlk hizmeti ekleyin.</p>
                            </div>
                        )}

                        {/* Service form (add / edit) */}
                        {showServiceForm ? (
                            <ServiceFormPanel
                                form={serviceForm}
                                setForm={setServiceForm}
                                onSave={saveService}
                                onCancel={() => { setShowServiceForm(false); setEditingServiceId(null); }}
                                saving={savingService}
                                parentServices={services}
                                isEdit={!!editingServiceId}
                            />
                        ) : (
                            <button onClick={openAddService} style={{ ...S.btnPrimary, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}>
                                <HiPlus /> Yeni Hizmet Ekle
                            </button>
                        )}
                    </div>
                )}

                {/* ═══════════════════════════════════════════
                    TAB 3 — TAKVİM
                ═══════════════════════════════════════════ */}
                {tab === 'availability' && (
                    <div>
                        {/* iCal Sync */}
                        <div style={S.card}>
                            <h3 style={S.sectionTitle}>🔗 iCal Takvim Senkronizasyonu</h3>
                            <p style={{ fontSize: '0.83rem', color: '#6b7280', margin: '0 0 14px', lineHeight: 1.6 }}>
                                Google, Apple veya Outlook takviminizin iCal (ICS) URL'sini girin. Sistem bu URL'yi periyodik olarak okuyarak uygun saatleri otomatik ekler.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div>
                                    <label style={S.label}>iCal URL</label>
                                    <input style={S.input} value={form.ical_url}
                                        onChange={e => setForm(f => ({ ...f, ical_url: e.target.value }))}
                                        placeholder="https://calendar.google.com/calendar/ical/.../.../basic.ics" />
                                    <span style={{ fontSize: '0.73rem', color: '#9ca3af', marginTop: 4, display: 'block' }}>
                                        Google: Takvim Ayarları → Gizli adres (iCal) · Apple: iCloud → Takvimi paylaş → Genel Takvim · Outlook: Takvim → Yayınla → ICS linki
                                    </span>
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88rem', userSelect: 'none' }}>
                                    <input type="checkbox" checked={form.ical_sync_enabled === 1}
                                        onChange={e => setForm(f => ({ ...f, ical_sync_enabled: e.target.checked ? 1 : 0 }))} />
                                    <span>Otomatik senkronizasyonu etkinleştir (her 20 dakikada bir)</span>
                                </label>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <button onClick={syncIcal} disabled={icalSyncing || !form.ical_url}
                                        style={{ ...S.btnPrimary, opacity: !form.ical_url ? 0.5 : 1, fontSize: '0.88rem', padding: '8px 18px' }}>
                                        {icalSyncing ? '⏳ Senkronize ediliyor...' : '🔄 Şimdi Senkronize Et'}
                                    </button>
                                    <button onClick={saveInfo} disabled={saving}
                                        style={{ ...S.btnGhost, fontSize: '0.88rem' }}>
                                        {saving ? '⏳...' : '💾 iCal Ayarlarını Kaydet'}
                                    </button>
                                    {icalMsg && (
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: icalMsg.startsWith('Hata') ? '#dc2626' : '#16a34a' }}>
                                            {icalMsg}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Add slots manually */}
                        <div style={S.card}>
                            <h3 style={S.sectionTitle}>Uygun Saat Ekle</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div>
                                    <label style={S.label}>Tarih</label>
                                    <input type="date" style={{ ...S.input, maxWidth: 220 }} value={slotDate}
                                        onChange={e => setSlotDate(e.target.value)} />
                                </div>
                                <div>
                                    <label style={S.label}>Saat Dilimleri</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {slotTimes.map((t, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <input type="time" style={{ ...S.input, width: 130 }} value={t.start}
                                                    onChange={e => updateSlotTime(i, 'start', e.target.value)} />
                                                <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>→</span>
                                                <input type="time" style={{ ...S.input, width: 130 }} value={t.end}
                                                    onChange={e => updateSlotTime(i, 'end', e.target.value)} />
                                                {slotTimes.length > 1 && (
                                                    <button onClick={() => removeSlotTime(i)} style={{ ...S.btnDanger, padding: '6px 8px' }}>
                                                        <HiTrash />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={addSlotTime} style={{ ...S.btnGhost, marginTop: 8, width: 'fit-content' }}>
                                        <HiPlus /> Saat Dilimi Ekle
                                    </button>
                                </div>
                                <button onClick={addSlots} disabled={!slotDate || addingSlots}
                                    style={{ ...S.btnPrimary, width: 'fit-content', opacity: !slotDate ? 0.5 : 1 }}>
                                    {addingSlots ? '⏳ Ekleniyor...' : `📅 ${slotTimes.length} Slot Ekle`}
                                </button>
                            </div>
                        </div>

                        {/* Existing slots grouped by date */}
                        <h3 style={{ fontSize: '1rem', color: '#1e3a5f', marginBottom: 12 }}>
                            Mevcut Slotlar ({slots.length} adet)
                        </h3>
                        {Object.keys(slotsByDate).sort().length === 0 && (
                            <p style={{ color: '#9ca3af', background: '#f9fafb', borderRadius: 10, padding: 20, textAlign: 'center' }}>
                                Henüz uygun slot eklenmemiş.
                            </p>
                        )}
                        {Object.entries(slotsByDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, daySlots]) => (
                            <div key={date} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', marginBottom: 12, overflow: 'hidden' }}>
                                <div style={{ background: '#f8faff', padding: '10px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <strong style={{ fontSize: '0.9rem', color: '#1e3a5f' }}>
                                        📅 {new Date(date + 'T00:00:00').toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </strong>
                                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{(daySlots as any[]).length} slot</span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 12 }}>
                                    {(daySlots as any[]).map((s: any) => {
                                        const st = STATUS_COLORS[s.status] || STATUS_COLORS.available;
                                        return (
                                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: st.bg, border: `1px solid ${st.color}20`, borderRadius: 8, padding: '5px 10px' }}>
                                                <span style={{ fontSize: '0.85rem', color: st.color, fontWeight: 600 }}>
                                                    {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                                                </span>
                                                <span style={{ fontSize: '0.72rem', color: st.color }}>{st.label}</span>
                                                <button onClick={() => deleteSlot(s.id, s.status)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '0.85rem', lineHeight: 1, padding: '0 2px' }}>×</button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
