import { useCallback, useEffect, useRef, useState } from 'react';
import EmailEditor, { type EditorRef } from 'react-email-editor';
import AdminLayout from '../../layouts/AdminLayout';
import type { EmailTemplate } from '../types';
import {
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
} from '../services/automationService';

// ─── Merge tags for Unlayer ───────────────────────────────────
// Array format is required for the merge tag picker to appear in the toolbar

const MERGE_TAGS = [
  { name: 'Ad',                value: '{{first_name}}',       sample: 'Ayşe' },
  { name: 'Soyad',             value: '{{last_name}}',        sample: 'Yılmaz' },
  { name: 'E-posta',           value: '{{email}}',            sample: 'ayse@example.com' },
  { name: 'Şirket',            value: '{{company_name}}',     sample: 'Acme A.Ş.' },
  { name: 'Hizmet Adı',        value: '{{service_name}}',     sample: 'Go-to-Market Paketi' },
  { name: 'Form Linki',        value: '{{form_link}}',        sample: 'https://khilonfast.com/onboarding?token=...' },
  { name: 'Sepet Linki',       value: '{{cart_link}}',        sample: 'https://khilonfast.com/odeme?cart=...' },
  { name: 'İletişim Linki',    value: '{{contact_link}}',     sample: 'https://khilonfast.com/iletisim' },
  { name: 'Giriş Linki',       value: '{{login_url}}',        sample: 'https://khilonfast.com/giris' },
  { name: 'Sipariş No',        value: '{{order_id}}',         sample: 'ORD-20240409' },
  { name: 'Listeden Çık',      value: '{{unsubscribe_link}}', sample: 'https://khilonfast.com/api/unsubscribe?...' },
];

// Unlayer editor options
const EDITOR_OPTIONS = {
  displayMode: 'email' as const,
  locale: 'tr-TR',
  appearance: {
    theme: 'light' as const,
  },
  features: {
    textEditor: { spellChecker: false, tables: true },
    mergeTags: true,  // enables the { } merge tag button in the text toolbar
  },
  mergeTags: MERGE_TAGS,
  fonts: {
    showDefaultFonts: true,
    customFonts: [
      { label: 'Inter Tight', value: "'Inter Tight', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&display=swap' },
    ],
  },
  tools: {
    button: { enabled: true },
    divider: { enabled: true },
    image: { enabled: true },
    social: { enabled: true },
    text: { enabled: true },
    video: { enabled: false },
  },
};

// ─── Form state ───────────────────────────────────────────────

interface FormState {
  name: string;
  subject: string;
  preview_text: string;
  sender_name: string;
  sender_email: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  subject: '',
  preview_text: '',
  sender_name: 'Khilonfast',
  sender_email: 'merhaba@khilonfast.com',
};



// ─── Main component ───────────────────────────────────────────

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editorReady, setEditorReady] = useState(false);

  // Pending design to load once editor is ready
  const pendingDesign = useRef<object | null>(null);
  const emailEditorRef = useRef<EditorRef>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError('');
    try { setTemplates(await getEmailTemplates()); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  // ── Open editor for new template ──────────────────────────────
  function openNew() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    pendingDesign.current = null;
    setEditorReady(false);
    setEditorOpen(true);
  }

  // ── Open editor for existing template ─────────────────────────
  function openEdit(tpl: EmailTemplate) {
    setForm({
      name:         tpl.name,
      subject:      tpl.subject,
      preview_text: tpl.preview_text ?? '',
      sender_name:  tpl.sender_name,
      sender_email: tpl.sender_email,
    });
    setEditingId(tpl.id);
    setEditorReady(false);

    // Store design to load once editor mounts
    if (tpl.design_json) {
      try { pendingDesign.current = JSON.parse(tpl.design_json); }
      catch { pendingDesign.current = null; }
    } else {
      pendingDesign.current = null;
    }

    setEditorOpen(true);
  }

  // ── Editor ready callback ────────────────────────────────────
  const onReady = useCallback(() => {
    setEditorReady(true);
    if (pendingDesign.current && emailEditorRef.current?.editor) {
      emailEditorRef.current.editor.loadDesign(pendingDesign.current as never);
      pendingDesign.current = null;
    }
  }, []);

  // ── Save ─────────────────────────────────────────────────────
  function handleSave() {
    if (!form.name.trim() || !form.subject.trim()) {
      alert('Şablon adı ve konu satırı zorunludur.');
      return;
    }
    if (!emailEditorRef.current?.editor) return;

    setSaving(true);
    emailEditorRef.current.editor.exportHtml(async ({ design, html }) => {
      try {
        // Extract {{variable}} tags from exported HTML
        const matches = html.match(/\{\{(\w+)\}\}/g) ?? [];
        const variables = [...new Set(matches.map((m: string) => m.slice(2, -2)))];

        const payload = {
          name:         form.name.trim(),
          subject:      form.subject.trim(),
          preview_text: form.preview_text.trim() || undefined,
          sender_name:  form.sender_name || 'Khilonfast',
          sender_email: form.sender_email || 'merhaba@khilonfast.com',
          body_html:    html,
          design_json:  JSON.stringify(design),
          variables,
        };

        if (editingId) {
          const updated = await updateEmailTemplate(editingId, payload);
          setTemplates(prev => prev.map(t => t.id === editingId ? updated : t));
        } else {
          const created = await createEmailTemplate(payload);
          setTemplates(prev => [created, ...prev]);
        }
        setEditorOpen(false);
      } catch (e) {
        alert((e as Error).message);
      } finally {
        setSaving(false);
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu şablonu silmek istediğinize emin misiniz?')) return;
    try {
      await deleteEmailTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      if (editingId === id) setEditorOpen(false);
    } catch (e) { alert((e as Error).message); }
  }

  // ─── Render ──────────────────────────────────────────────────

  // Full-screen editor overlay
  if (editorOpen) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', flexDirection: 'column', background: '#f8fafc', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '12px 20px', background: '#1a3a52',
          borderBottom: '1px solid #0f2236', flexShrink: 0,
        }}>
          {/* Back */}
          <button
            onClick={() => setEditorOpen(false)}
            style={{ background: 'none', border: '1px solid #334155', color: '#94a3b8', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            ← Geri
          </button>

          <div style={{ width: 1, height: 28, background: '#334155' }} />

          {/* Name */}
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Şablon adı"
            style={{ background: '#0f2236', border: '1px solid #334155', borderRadius: 8, padding: '7px 14px', fontSize: 14, fontWeight: 600, color: '#f1f5f9', outline: 'none', width: 220 }}
          />

          {/* Subject */}
          <input
            value={form.subject}
            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            placeholder="Konu satırı (örn: Merhaba {{first_name}}!)"
            style={{ background: '#0f2236', border: '1px solid #334155', borderRadius: 8, padding: '7px 14px', fontSize: 13, color: '#f1f5f9', outline: 'none', flex: 1 }}
          />

          {/* Preview text */}
          <input
            value={form.preview_text}
            onChange={e => setForm(f => ({ ...f, preview_text: e.target.value }))}
            placeholder="Önizleme metni…"
            style={{ background: '#0f2236', border: '1px solid #334155', borderRadius: 8, padding: '7px 14px', fontSize: 13, color: '#94a3b8', outline: 'none', width: 200 }}
          />

          <div style={{ width: 1, height: 28, background: '#334155' }} />

          {/* Sender */}
          <input
            value={form.sender_name}
            onChange={e => setForm(f => ({ ...f, sender_name: e.target.value }))}
            placeholder="Gönderen adı"
            style={{ background: '#0f2236', border: '1px solid #334155', borderRadius: 8, padding: '7px 12px', fontSize: 12, color: '#94a3b8', outline: 'none', width: 130 }}
          />
          <input
            value={form.sender_email}
            onChange={e => setForm(f => ({ ...f, sender_email: e.target.value }))}
            placeholder="Gönderen e-posta"
            style={{ background: '#0f2236', border: '1px solid #334155', borderRadius: 8, padding: '7px 12px', fontSize: 12, color: '#94a3b8', outline: 'none', width: 200 }}
          />

          <div style={{ width: 1, height: 28, background: '#334155' }} />

          {/* Delete (edit mode) */}
          {editingId && (
            <button
              onClick={() => handleDelete(editingId)}
              style={{ background: '#7f1d1d', border: 'none', color: '#fca5a5', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              Sil
            </button>
          )}

          {/* Save */}
          {!editorReady && (
            <span style={{ fontSize: 12, color: '#64748b' }}>Editör yükleniyor…</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !editorReady || !form.name.trim() || !form.subject.trim()}
            style={{
              background: editorReady ? '#c5d63d' : '#334155',
              color: editorReady ? '#1a3a52' : '#64748b',
              border: 'none', borderRadius: 8,
              padding: '8px 20px', fontSize: 14, fontWeight: 700,
              cursor: editorReady ? 'pointer' : 'default',
              transition: 'all 0.2s',
            }}
          >
            {saving ? 'Kaydediliyor…' : editingId ? '💾 Güncelle' : '💾 Kaydet'}
          </button>
        </div>

        {/* Unlayer canvas */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <EmailEditor
            ref={emailEditorRef}
            onReady={onReady}
            options={EDITOR_OPTIONS as any}
            style={{ flex: 1 }}
            minHeight="100%"
          />
        </div>
      </div>
    );
  }

  // ─── List view ────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div style={{ padding: '0 0 60px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#1a3a52' }}>E-posta Şablonları</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
              Sürükle-bırak görsel editörle e-posta şablonları oluşturun — Unlayer ile
            </p>
          </div>
          <button onClick={openNew} style={actionBtn('#1a3a52', '#fff')}>
            + Yeni Şablon
          </button>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 16px', marginBottom: 20, color: '#b91c1c', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Merge tags info bar */}
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '12px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0369a1' }}>Editörde kullanılabilir değişkenler:</span>
          {MERGE_TAGS.map(t => (
            <span key={t.value} style={varChip} title={`Örnek: ${t.sample}`}>{t.value}</span>
          ))}
        </div>

        {/* Template cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 64, color: '#64748b' }}>Yükleniyor...</div>
        ) : templates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>✉️</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a3a52', marginBottom: 8 }}>Henüz şablon yok</div>
            <div style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>Profesyonel e-posta şablonları oluşturmaya başlayın</div>
            <button onClick={openNew} style={actionBtn('#1a3a52', '#fff')}>+ İlk Şablonu Oluştur</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {templates.map(tpl => (
              <div key={tpl.id} style={{
                background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                transition: 'box-shadow 0.2s',
              }}>
                {/* Card preview band */}
                <div style={{
                  background: 'linear-gradient(135deg, #1a3a52 0%, #2d5570 100%)',
                  padding: '20px 20px 16px', position: 'relative',
                }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                    E-posta Şablonu
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: 4 }}>
                    {tpl.name}
                  </div>
                  {tpl.design_json && (
                    <div style={{ position: 'absolute', top: 16, right: 16, background: '#c5d63d', color: '#1a3a52', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6 }}>
                      UNLAYER
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{tpl.subject}</div>

                  {tpl.preview_text && (
                    <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', lineHeight: 1.4 }}>
                      "{tpl.preview_text}"
                    </div>
                  )}

                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    📤 {tpl.sender_name} &lt;{tpl.sender_email}&gt;
                  </div>

                  {tpl.variables.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                      {tpl.variables.map(v => <span key={v} style={varChip}>{`{{${v}}}`}</span>)}
                    </div>
                  )}

                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 'auto', paddingTop: 8 }}>
                    {new Date(tpl.updated_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 8 }}>
                  <button onClick={() => openEdit(tpl)} style={{ ...actionBtn('#1a3a52', '#fff'), flex: 1, textAlign: 'center' as const }}>
                    ✏️ Düzenle
                  </button>
                  <button onClick={() => handleDelete(tpl.id)} style={actionBtn('#ef4444', '#fff')}>
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function actionBtn(bg: string, color: string): React.CSSProperties {
  return {
    background: bg, color, border: 'none', borderRadius: 8,
    padding: '9px 18px', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap' as const,
  };
}

const varChip: React.CSSProperties = {
  fontSize: 11, background: '#eff6ff', color: '#1d4ed8',
  borderRadius: 6, padding: '2px 8px', fontFamily: 'monospace',
  border: '1px solid #bfdbfe',
};
