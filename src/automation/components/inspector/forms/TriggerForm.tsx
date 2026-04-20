import type { TriggerConfig, TriggerEvent } from '../../../types';

const TRIGGER_EVENTS: { value: TriggerEvent; label: string }[] = [
  { value: 'purchase_completed',      label: 'Satın alma tamamlandı' },
  { value: 'checkout_email_entered',  label: 'Ödeme e-postası girildi' },
  { value: 'onboarding_not_completed',label: 'Onboarding tamamlanmadı' },
  { value: 'service_not_used',        label: 'Servis kullanılmadı' },
  { value: 'payment_failed',          label: 'Ödeme başarısız' },
  { value: 'subscription_cancelled',  label: 'Abonelik iptal edildi' },
];

interface Props { config: TriggerConfig; onChange: (c: TriggerConfig) => void; }

export default function TriggerForm({ config, onChange }: Props) {
  return (
    <>
      <Field label="Tetikleyici Olay">
        <select
          value={config.trigger_event ?? ''}
          onChange={e => onChange({ ...config, trigger_event: e.target.value as TriggerEvent })}
          style={selectStyle}
        >
          <option value="">-- Seçin --</option>
          {TRIGGER_EVENTS.map(ev => (
            <option key={ev.value} value={ev.value}>{ev.label}</option>
          ))}
        </select>
      </Field>
      <Field label="Açıklama (isteğe bağlı)">
        <input
          type="text"
          value={config.description ?? ''}
          onChange={e => onChange({ ...config, description: e.target.value })}
          placeholder="Kısa açıklama..."
          style={inputStyle}
        />
      </Field>
    </>
  );
}

// ─── Shared helpers ──────────────────────────────────────────

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export const inputStyle: React.CSSProperties = {
  width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0',
  borderRadius: 6, fontSize: 12, boxSizing: 'border-box', background: '#fff',
};

export const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: 'pointer',
};
