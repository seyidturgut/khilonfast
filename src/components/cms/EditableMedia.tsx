import { useState, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';

type MediaType = 'image' | 'video';

interface EditableMediaProps {
    pageSlug: string;
    fieldKey: string;
    type: MediaType;
    src: string;
    currentLang: 'tr' | 'en';
    children: (resolvedSrc: string) => ReactNode;
}

function normalizeVideoUrl(url: string): string {
    if (!url) return url;
    const vimeoMatch = url.match(/^https?:\/\/(?:www\.)?vimeo\.com\/(?:video\/)?(\d+)(?:[/?#].*)?$/i);
    if (vimeoMatch?.[1]) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    const ytMatch = url.match(/^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([\w-]+)/i)
        || url.match(/^https?:\/\/youtu\.be\/([\w-]+)/i);
    if (ytMatch?.[1]) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    return url;
}

interface CacheEntry { contentJson: any }
const cmsCache = new Map<string, CacheEntry | null>();
const cmsPending = new Map<string, Promise<CacheEntry | null>>();

// Public anon cache — sadece tek dilin medya/içerik bloğu
interface PublicEntry { content: any }
const publicCache = new Map<string, PublicEntry | null>();
const publicPending = new Map<string, Promise<PublicEntry | null>>();

async function loadPageContent(slug: string, token: string, apiBase: string): Promise<CacheEntry | null> {
    if (cmsCache.has(slug)) return cmsCache.get(slug) ?? null;
    if (cmsPending.has(slug)) return cmsPending.get(slug)!;
    const p = (async (): Promise<CacheEntry | null> => {
        try {
            const res = await fetch(`${apiBase}/admin/pages/slug/${encodeURIComponent(slug)}/content`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return null;
            const data = await res.json();
            if (!data?.content_json) return null;
            const contentJson = typeof data.content_json === 'string'
                ? JSON.parse(data.content_json) : data.content_json;
            const entry: CacheEntry = { contentJson };
            cmsCache.set(slug, entry);
            return entry;
        } catch { return null; }
    })();
    cmsPending.set(slug, p);
    const result = await p;
    cmsPending.delete(slug);
    return result;
}

/**
 * Anon kullanıcılar için public CMS endpoint — `/api/pages/slug/:slug?lang=tr|en`
 * Backend dile göre filtreliyor (sadece o dilin bloğunu döndürür).
 */
async function loadPublicPageContent(slug: string, lang: 'tr' | 'en', apiBase: string): Promise<PublicEntry | null> {
    const cacheKey = `${slug}::${lang}`;
    if (publicCache.has(cacheKey)) return publicCache.get(cacheKey) ?? null;
    if (publicPending.has(cacheKey)) return publicPending.get(cacheKey)!;
    const p = (async (): Promise<PublicEntry | null> => {
        try {
            const res = await fetch(`${apiBase}/pages/slug/${encodeURIComponent(slug)}?lang=${lang}`);
            if (!res.ok) return null;
            const data = await res.json();
            if (!data?.content) return null;
            const entry: PublicEntry = { content: data.content };
            publicCache.set(cacheKey, entry);
            return entry;
        } catch { return null; }
    })();
    publicPending.set(cacheKey, p);
    const result = await p;
    publicPending.delete(cacheKey);
    return result;
}

export function invalidateCmsCache(slug: string) {
    cmsCache.delete(slug);
    publicCache.delete(`${slug}::tr`);
    publicCache.delete(`${slug}::en`);
}

export default function EditableMedia({ pageSlug, fieldKey, type, src, currentLang, children }: EditableMediaProps) {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const apiBase = API_BASE_URL;

    const [trOverride, setTrOverride] = useState<string | null>(null);
    const [enOverride, setEnOverride] = useState<string | null>(null);
    const [contentJson, setContentJson] = useState<any>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'tr' | 'en'>('tr');
    const [editTr, setEditTr] = useState('');
    const [editEn, setEditEn] = useState('');
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isAdmin) {
            // Admin: tüm contentJson (tr+en) gerekli — modal düzenleme için
            const token = localStorage.getItem('token');
            if (!token) return;
            loadPageContent(pageSlug, token, apiBase).then(entry => {
                if (!entry) return;
                setContentJson(entry.contentJson);
                setTrOverride(entry.contentJson?.tr?.media?.[fieldKey] ?? null);
                setEnOverride(entry.contentJson?.en?.media?.[fieldKey] ?? null);
            });
        } else {
            // Anon: public endpoint, sadece mevcut dile ait override'ı yükle
            loadPublicPageContent(pageSlug, currentLang, apiBase).then(entry => {
                if (!entry) return;
                const override = entry.content?.media?.[fieldKey] ?? null;
                if (currentLang === 'tr') setTrOverride(override);
                else setEnOverride(override);
            });
        }
    }, [isAdmin, pageSlug, fieldKey, apiBase, currentLang]);

    const rawSrc = currentLang === 'tr' ? (trOverride || src) : (enOverride || src);
    const resolvedSrc = type === 'video' ? normalizeVideoUrl(rawSrc) : rawSrc;

    if (!isAdmin) return <>{children(resolvedSrc)}</>;

    const openModal = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setEditTr(trOverride || src);
        setEditEn(enOverride || src);
        setActiveTab(currentLang);
        setModalOpen(true);
    };

    const uploadFile = async (file: File): Promise<string | null> => {
        const token = localStorage.getItem('token');
        if (!token) return null;
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const res = await fetch(`${apiBase}/admin/media/upload-base64`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ dataUrl: e.target?.result, filename: file.name }),
                    });
                    const data = await res.json();
                    resolve(data?.path ?? null);
                } catch { resolve(null); }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        setSaving(true);
        try {
            const nextJson = {
                ...(contentJson || {}),
                tr: { ...(contentJson?.tr || {}), media: { ...(contentJson?.tr?.media || {}), [fieldKey]: editTr } },
                en: { ...(contentJson?.en || {}), media: { ...(contentJson?.en?.media || {}), [fieldKey]: editEn } },
            };
            const res = await fetch(`${apiBase}/admin/pages/slug/${encodeURIComponent(pageSlug)}/content`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content_json: nextJson, is_published: true }),
            });
            if (!res.ok) return;
            setTrOverride(editTr);
            setEnOverride(editEn);
            setContentJson(nextJson);
            cmsCache.set(pageSlug, { contentJson: nextJson });
            setModalOpen(false);
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            {children(resolvedSrc)}
            <button
                type="button"
                onClick={openModal}
                title="Düzenle"
                style={{
                    position: 'absolute', top: 10, right: 10, zIndex: 20,
                    background: 'rgba(15,23,42,0.72)', color: '#fff',
                    border: 'none', borderRadius: 8, width: 34, height: 34,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: 15, backdropFilter: 'blur(4px)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                }}
            >
                ✏️
            </button>

            {modalOpen && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
                    onClick={() => setModalOpen(false)}
                >
                    <div
                        style={{ background: '#fff', borderRadius: 16, padding: 28, width: 480, maxWidth: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                                {type === 'image' ? '🖼️ Görsel Düzenle' : '🎬 Video Düzenle'}
                            </div>
                            <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b', lineHeight: 1 }}>✕</button>
                        </div>

                        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                            {(['tr', 'en'] as const).map(lang => (
                                <button key={lang} onClick={() => setActiveTab(lang)}
                                    style={{ padding: '6px 22px', borderRadius: 8, border: '1px solid #cbd5e1', fontWeight: 700, cursor: 'pointer', fontSize: 13,
                                             background: activeTab === lang ? '#0f172a' : '#fff', color: activeTab === lang ? '#fff' : '#0f172a' }}>
                                    {lang.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        {type === 'image' && (
                            <div style={{ display: 'grid', gap: 10 }}>
                                <img
                                    src={activeTab === 'tr' ? editTr : editEn}
                                    alt="preview"
                                    width={400}
                                    height={160}
                                    loading="lazy"
                                    decoding="async"
                                    style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 10, background: '#f1f5f9', display: 'block' }}
                                    onError={e => { (e.target as HTMLImageElement).style.opacity = '0.15'; }}
                                />
                                <input
                                    type="text"
                                    value={activeTab === 'tr' ? editTr : editEn}
                                    onChange={e => activeTab === 'tr' ? setEditTr(e.target.value) : setEditEn(e.target.value)}
                                    placeholder="Görsel URL"
                                    style={{ padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box' }}
                                />
                                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                                    style={{ display: 'none' }}
                                    onChange={async e => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        setUploading(true);
                                        const path = await uploadFile(file);
                                        setUploading(false);
                                        if (path) activeTab === 'tr' ? setEditTr(path) : setEditEn(path);
                                        e.target.value = '';
                                    }}
                                />
                                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                                    style={{ padding: '9px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, textAlign: 'left' }}>
                                    {uploading ? '⏳ Yükleniyor...' : '📁 Dosya Seç'}
                                </button>
                            </div>
                        )}

                        {type === 'video' && (
                            <input
                                type="text"
                                value={activeTab === 'tr' ? editTr : editEn}
                                onChange={e => activeTab === 'tr' ? setEditTr(e.target.value) : setEditEn(e.target.value)}
                                placeholder="Video URL (YouTube, Vimeo...)"
                                style={{ padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box' }}
                            />
                        )}

                        <button onClick={handleSave} disabled={saving}
                            style={{ marginTop: 16, width: '100%', padding: '12px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 14, opacity: saving ? 0.7 : 1 }}>
                            {saving ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
