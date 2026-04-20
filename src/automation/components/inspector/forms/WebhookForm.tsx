import type { WebhookConfig, WebhookMethod } from '../../../types';
import { Field, inputStyle, selectStyle } from './TriggerForm';

interface Props { config: WebhookConfig; onChange: (c: WebhookConfig) => void; }

export default function WebhookForm({ config, onChange }: Props) {
  return (
    <>
      <Field label="Metod">
        <select value={config.method ?? 'POST'} onChange={e => onChange({ ...config, method: e.target.value as WebhookMethod })} style={selectStyle}>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
        </select>
      </Field>
      <Field label="URL">
        <input type="url" value={config.url ?? ''} onChange={e => onChange({ ...config, url: e.target.value })} style={inputStyle} placeholder="https://api.example.com/hook" />
      </Field>
      <Field label="Payload Şablonu (JSON)">
        <textarea
          value={config.payload_template ?? ''}
          onChange={e => onChange({ ...config, payload_template: e.target.value })}
          rows={4}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 11 }}
          placeholder={'{\n  "user": "{{email}}",\n  "event": "purchase"\n}'}
        />
      </Field>
    </>
  );
}
