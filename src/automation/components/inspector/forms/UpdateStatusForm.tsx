import type { UpdateStatusConfig, UpdateStatusTargetType } from '../../../types';
import { Field, inputStyle, selectStyle } from './TriggerForm';

interface Props { config: UpdateStatusConfig; onChange: (c: UpdateStatusConfig) => void; }

export default function UpdateStatusForm({ config, onChange }: Props) {
  return (
    <>
      <Field label="Hedef">
        <select value={config.target_type ?? 'contact'} onChange={e => onChange({ ...config, target_type: e.target.value as UpdateStatusTargetType })} style={selectStyle}>
          <option value="contact">Kişi (contact)</option>
          <option value="order">Sipariş (order)</option>
          <option value="service">Servis (service)</option>
          <option value="customer">Müşteri (customer)</option>
        </select>
      </Field>
      <Field label="Alan Adı">
        <input type="text" value={config.field_name ?? ''} onChange={e => onChange({ ...config, field_name: e.target.value })} style={inputStyle} placeholder="status, stage, tag..." />
      </Field>
      <Field label="Yeni Değer">
        <input type="text" value={config.value ?? ''} onChange={e => onChange({ ...config, value: e.target.value })} style={inputStyle} placeholder="paused, onboarding_pending..." />
      </Field>
    </>
  );
}
