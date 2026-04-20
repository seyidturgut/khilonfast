import type { AddTagConfig, UpdateStatusTargetType } from '../../../types';
import { Field, inputStyle, selectStyle } from './TriggerForm';

interface Props { config: AddTagConfig; onChange: (c: AddTagConfig) => void; }

export default function AddTagForm({ config, onChange }: Props) {
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
      <Field label="Etiket Adı">
        <input type="text" value={config.tag_name ?? ''} onChange={e => onChange({ ...config, tag_name: e.target.value })} style={inputStyle} placeholder="abandoned_checkout, vip_customer..." />
      </Field>
    </>
  );
}
