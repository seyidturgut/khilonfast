import type { Automation, ValidationResult } from '../../types';

interface BuilderToolbarProps {
  automation: Automation | null;
  name: string;
  onNameChange: (name: string) => void;
  onBack: () => void;
  onSaveDraft: () => void;
  onValidate: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  saving: boolean;
  validation: ValidationResult | null;
}

export default function BuilderToolbar({
  automation,
  name,
  onNameChange,
  onBack,
  onSaveDraft,
  onValidate,
  onActivate,
  onDeactivate,
  saving,
  validation,
}: BuilderToolbarProps) {
  const isActive = automation?.status === 'active';
  const errorCount = validation?.errors.filter(e => e.severity === 'error').length ?? 0;
  const warnCount  = validation?.errors.filter(e => e.severity === 'warning').length ?? 0;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 16px', background: '#1a3a52', color: '#fff',
      borderBottom: '1px solid #0f2236', flexShrink: 0, flexWrap: 'wrap',
    }}>
      {/* Back */}
      <button onClick={onBack} style={btnStyle('#334155', '#fff')}>
        ← Geri
      </button>

      <div style={{ width: 1, height: 28, background: '#334155' }} />

      {/* Name */}
      <input
        value={name}
        onChange={e => onNameChange(e.target.value)}
        style={{
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff', borderRadius: 6, padding: '5px 10px', fontSize: 14, fontWeight: 700,
          minWidth: 220,
        }}
        placeholder="Otomasyon Adı..."
      />

      {/* Status badge */}
      {automation && (
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
          background: automation.status === 'active' ? '#22c55e' : automation.status === 'inactive' ? '#94a3b8' : '#f59e0b',
          color: '#fff',
        }}>
          {automation.status === 'active' ? 'Aktif' : automation.status === 'inactive' ? 'Pasif' : 'Taslak'}
        </span>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Validation result */}
      {validation && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          {validation.valid ? (
            <span style={{ color: '#86efac' }}>✓ Geçerli</span>
          ) : (
            <span style={{ color: '#fca5a5' }}>✗ {errorCount} hata{warnCount > 0 ? `, ${warnCount} uyarı` : ''}</span>
          )}
        </div>
      )}

      {/* Actions */}
      <button onClick={onValidate} style={btnStyle('#334155', '#fff')}>
        🔍 Doğrula
      </button>
      <button onClick={onSaveDraft} disabled={saving} style={btnStyle('#0284c7', '#fff')}>
        {saving ? 'Kaydediliyor…' : '💾 Taslak Kaydet'}
      </button>

      {isActive ? (
        <button onClick={onDeactivate} style={btnStyle('#94a3b8', '#fff')}>
          ⏸ Deaktive Et
        </button>
      ) : (
        <button onClick={onActivate} style={btnStyle('#22c55e', '#fff')}>
          ▶ Aktive Et
        </button>
      )}
    </div>
  );
}

function btnStyle(bg: string, color: string): React.CSSProperties {
  return {
    background: bg, color, border: 'none', borderRadius: 6,
    padding: '6px 12px', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap',
  };
}
