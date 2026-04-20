import { Handle, Position, type NodeProps } from '@xyflow/react';
import { NODE_COLORS, NODE_ICONS, NODE_LABELS, baseCard } from './nodeStyles';
import type { ConditionConfig } from '../../types';

export default function ConditionNode({ data, selected }: NodeProps) {
  const config = (data?.config ?? {}) as ConditionConfig;
  const color = NODE_COLORS.condition;

  const summary = config.field && config.operator
    ? `${config.field} ${config.operator}${config.value ? ` "${config.value}"` : ''}`
    : null;

  return (
    <div style={{
      ...baseCard,
      borderColor: selected ? color : `${color}55`,
      boxShadow: selected ? `0 0 0 2px ${color}55` : baseCard.boxShadow,
      minWidth: 220,
    }}>
      <Handle type="target" position={Position.Top} style={{ background: color, width: 10, height: 10, border: '2px solid #fff' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ background: color, color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
          {NODE_ICONS.condition} {NODE_LABELS.condition}
        </span>
      </div>

      <div style={{ fontSize: 12, color: '#334155', marginBottom: 8 }}>
        {summary
          ? <span style={{ wordBreak: 'break-all' }}>{summary}</span>
          : <em style={{ color: '#94a3b8' }}>Koşul tanımlanmadı</em>}
      </div>

      {/* YES / NO output labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 4, position: 'relative', height: 24 }}>
        <span style={{ color: '#22c55e', fontWeight: 700, position: 'absolute', left: 8, bottom: 0 }}>✓ Evet</span>
        <span style={{ color: '#ef4444', fontWeight: 700, position: 'absolute', right: 8, bottom: 0 }}>✗ Hayır</span>
      </div>

      {/* YES handle — left-bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        style={{ background: '#22c55e', width: 10, height: 10, border: '2px solid #fff', left: '25%' }}
      />
      {/* NO handle — right-bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        style={{ background: '#ef4444', width: 10, height: 10, border: '2px solid #fff', left: '75%' }}
      />
    </div>
  );
}
