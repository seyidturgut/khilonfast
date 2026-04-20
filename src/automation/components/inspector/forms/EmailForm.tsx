import { useState, useEffect } from 'react';
import type { EmailConfig, EmailMode } from '../../../types';
import type { EmailTemplate } from '../../../types';
import { Field, inputStyle, selectStyle } from './TriggerForm';
import { getEmailTemplates } from '../../../services/automationService';

interface Props { config: EmailConfig; onChange: (c: EmailConfig) => void; }

export default function EmailForm({ config, onChange }: Props) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);

  useEffect(() => {
    getEmailTemplates().then(setTemplates);
  }, []);

  const mode = config.mode ?? 'custom';

  const applyTemplate = (id: string) => {
    const tpl = templates.find(t => t.id === id);
    if (!tpl) return;
    onChange({
      ...config,
      template_id: id,
      subject: tpl.subject,
      preview_text: tpl.preview_text ?? '',
      sender_name: tpl.sender_name,
      sender_email: tpl.sender_email,
      body_html: tpl.body_html,
      body_text: tpl.body_text ?? '',
      cta_label: tpl.cta_label ?? '',
      cta_url: tpl.cta_url ?? '',
    });
  };

  return (
    <>
      <Field label="Mod">
        <div style={{ display: 'flex', gap: 8 }}>
          {(['template', 'custom'] as EmailMode[]).map(m => (
            <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12 }}>
              <input type="radio" checked={mode === m} onChange={() => onChange({ ...config, mode: m })} />
              {m === 'template' ? 'Şablon' : 'Özel'}
            </label>
          ))}
        </div>
      </Field>

      {mode === 'template' && (
        <Field label="Şablon Seç">
          <select
            value={config.template_id ?? ''}
            onChange={e => applyTemplate(e.target.value)}
            style={selectStyle}
          >
            <option value="">-- Şablon Seçin --</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
      )}

      <Field label="Konu">
        <input type="text" value={config.subject ?? ''} onChange={e => onChange({ ...config, subject: e.target.value })} style={inputStyle} placeholder="E-posta konusu..." />
      </Field>

      <Field label="Gönderen Adı">
        <input type="text" value={config.sender_name ?? ''} onChange={e => onChange({ ...config, sender_name: e.target.value })} style={inputStyle} placeholder="Khilonfast Ekibi" />
      </Field>

      <Field label="Gönderen E-posta">
        <input type="email" value={config.sender_email ?? ''} onChange={e => onChange({ ...config, sender_email: e.target.value })} style={inputStyle} placeholder="merhaba@khilonfast.com" />
      </Field>

      {mode === 'custom' && (
        <>
          <Field label="HTML İçerik">
            <textarea
              value={config.body_html ?? ''}
              onChange={e => onChange({ ...config, body_html: e.target.value })}
              rows={5}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 11 }}
              placeholder="<p>Merhaba {{first_name}},</p>"
            />
          </Field>
          <Field label="CTA Butonu Metni">
            <input type="text" value={config.cta_label ?? ''} onChange={e => onChange({ ...config, cta_label: e.target.value })} style={inputStyle} placeholder="Devam Et" />
          </Field>
          <Field label="CTA URL">
            <input type="text" value={config.cta_url ?? ''} onChange={e => onChange({ ...config, cta_url: e.target.value })} style={inputStyle} placeholder="{{login_url}}" />
          </Field>
        </>
      )}

      <div style={{ fontSize: 10, color: '#64748b', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '6px 8px' }}>
        Değişkenler: {'{{first_name}}'} {'{{email}}'} {'{{service_name}}'} {'{{order_id}}'} {'{{login_url}}'}
      </div>
    </>
  );
}
