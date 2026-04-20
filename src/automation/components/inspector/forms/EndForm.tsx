import type { EndConfig } from '../../../types';
import { Field, inputStyle } from './TriggerForm';

interface Props { config: EndConfig; onChange: (c: EndConfig) => void; }

export default function EndForm({ config, onChange }: Props) {
  return (
    <Field label="Bitiş Nedeni (isteğe bağlı)">
      <input
        type="text"
        value={config.reason ?? ''}
        onChange={e => onChange({ ...config, reason: e.target.value })}
        style={inputStyle}
        placeholder="Akış tamamlandı, koşul sağlandı..."
      />
    </Field>
  );
}
