import type { WaitConfig, DelayType } from '../../../types';
import { Field, inputStyle, selectStyle } from './TriggerForm';

interface Props { config: WaitConfig; onChange: (c: WaitConfig) => void; }

export default function WaitForm({ config, onChange }: Props) {
  return (
    <>
      <Field label="Bekleme Süresi">
        <input
          type="number"
          min={1}
          value={config.delay_value ?? 1}
          onChange={e => onChange({ ...config, delay_value: Number(e.target.value) })}
          style={inputStyle}
        />
      </Field>
      <Field label="Birim">
        <select
          value={config.delay_type ?? 'hours'}
          onChange={e => onChange({ ...config, delay_type: e.target.value as DelayType })}
          style={selectStyle}
        >
          <option value="minutes">Dakika</option>
          <option value="hours">Saat</option>
          <option value="days">Gün</option>
          <option value="weeks">Hafta</option>
        </select>
      </Field>
    </>
  );
}
