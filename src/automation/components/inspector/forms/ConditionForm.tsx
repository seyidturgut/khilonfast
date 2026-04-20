import type { ConditionConfig, ConditionField, ConditionOperator } from '../../../types';
import { Field, inputStyle, selectStyle } from './TriggerForm';

const FIELDS: { value: ConditionField; label: string }[] = [
  { value: 'onboarding_form_submitted', label: 'Onboarding formu gönderildi' },
  { value: 'purchase_completed',        label: 'Satın alma tamamlandı' },
  { value: 'service_used',              label: 'Servis kullanıldı' },
  { value: 'email_verified',            label: 'E-posta doğrulandı' },
  { value: 'customer_tag',              label: 'Müşteri etiketi' },
  { value: 'service_status',            label: 'Servis durumu' },
  { value: 'payment_status',            label: 'Ödeme durumu' },
];

const OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: 'equals',       label: 'Eşit (=)' },
  { value: 'not_equals',   label: 'Eşit değil (≠)' },
  { value: 'contains',     label: 'İçerir' },
  { value: 'not_contains', label: 'İçermez' },
  { value: 'greater_than', label: 'Büyüktür (>)' },
  { value: 'less_than',    label: 'Küçüktür (<)' },
  { value: 'is_true',      label: 'Doğru (true)' },
  { value: 'is_false',     label: 'Yanlış (false)' },
];

const noValueOps: ConditionOperator[] = ['is_true', 'is_false'];

interface Props { config: ConditionConfig; onChange: (c: ConditionConfig) => void; }

export default function ConditionForm({ config, onChange }: Props) {
  const hideValue = noValueOps.includes(config.operator);
  return (
    <>
      <Field label="Alan">
        <select
          value={config.field ?? ''}
          onChange={e => onChange({ ...config, field: e.target.value as ConditionField })}
          style={selectStyle}
        >
          <option value="">-- Seçin --</option>
          {FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </Field>
      <Field label="Operatör">
        <select
          value={config.operator ?? ''}
          onChange={e => onChange({ ...config, operator: e.target.value as ConditionOperator })}
          style={selectStyle}
        >
          <option value="">-- Seçin --</option>
          {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </Field>
      {!hideValue && (
        <Field label="Değer">
          <input
            type="text"
            value={config.value ?? ''}
            onChange={e => onChange({ ...config, value: e.target.value })}
            placeholder="Karşılaştırılacak değer..."
            style={inputStyle}
          />
        </Field>
      )}
      <div style={{ fontSize: 11, color: '#64748b', background: '#fffbeb', border: '1px solid #fef08a', borderRadius: 6, padding: '6px 8px' }}>
        Koşul node'u <strong>Evet</strong> ve <strong>Hayır</strong> çıkışlarına sahiptir. Her iki çıkışı da bağlamayı unutmayın.
      </div>
    </>
  );
}
