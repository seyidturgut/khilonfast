import { useEffect, useRef, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import type { EmailTemplate } from '../types';
import {
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
} from '../services/automationService';
import UnlayerEmailEditor, { type UnlayerEditorHandle, KHILON_MERGE_TAGS } from '../../components/admin/UnlayerEmailEditor';
const MERGE_TAGS = KHILON_MERGE_TAGS;

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

  // Editor reference (Unlayer wrapper)
  const editorHandle = useRef<UnlayerEditorHandle>(null);
  const [initialDesign, setInitialDesign] = useState<object | null>(null);
  const [fallbackHtml, setFallbackHtml] = useState<string | null>(null);

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
    setInitialDesign(null);
    setFallbackHtml(null);
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

    if (tpl.design_json) {
      try { setInitialDesign(JSON.parse(tpl.design_json)); }
      catch { setInitialDesign(null); }
      setFallbackHtml(null);
    } else if (tpl.body_html) {
      setInitialDesign(null);
      setFallbackHtml(tpl.body_html);
    } else {
      setInitialDesign(null);
      setFallbackHtml(null);
    }

    setEditorOpen(true);
  }

  // ── Save ─────────────────────────────────────────────────────
  async function handleSave() {
    if (!form.name.trim() || !form.subject.trim()) {
      alert('Şablon adı ve konu satırı zorunludur.');
      return;
    }
    if (!editorHandle.current?.isReady()) return;

    setSaving(true);
    try {
      const { html, design, variables } = await editorHandle.current.export();
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
          <UnlayerEmailEditor
            ref={editorHandle}
            initialDesign={initialDesign}
            fallbackHtml={fallbackHtml}
            preheaderText={form.preview_text}
            onReady={() => setEditorReady(true)}
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
