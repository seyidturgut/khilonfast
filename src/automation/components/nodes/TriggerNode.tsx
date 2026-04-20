import { Handle, Position, type NodeProps } from '@xyflow/react';
import { NODE_COLORS, NODE_ICONS, NODE_LABELS, baseCard } from './nodeStyles';
import { triggerEventLabel } from '../../utils/transform';
import type { TriggerConfig } from '../../types';

export default function TriggerNode({ data, selected }: NodeProps) {
  const config = (data?.config ?? {}) as TriggerConfig;
  const color = NODE_COLORS.trigger;

  return (
    <div style={{
      ...baseCard,
      borderColor: selected ? color : `${color}55`,
      boxShadow: selected ? `0 0 0 2px ${color}55, 0 4px 12px rgba(0,0,0,0.12)` : baseCard.boxShadow,
    }}>
      {/* No top handle — trigger is always the entry point */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ background: color, color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
          {NODE_ICONS.trigger} {NODE_LABELS.trigger}
        </span>
      </div>
      <div style={{ fontSize: 12, color: '#334155' }}>
        {config.trigger_event
          ? <strong>{triggerEventLabel(config.trigger_event)}</strong>
          : <em style={{ color: '#94a3b8' }}>Olay seçilmedi</em>}
      </div>
      {config.description && (
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{config.description}</div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: color, width: 10, height: 10, border: '2px solid #fff' }}
      />
    </div>
  );
}
