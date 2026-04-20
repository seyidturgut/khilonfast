import { Handle, Position, type NodeProps } from '@xyflow/react';
import { NODE_COLORS, NODE_ICONS, NODE_LABELS, baseCard } from './nodeStyles';
import type { EndConfig } from '../../types';

export default function EndNode({ data, selected }: NodeProps) {
  const config = (data?.config ?? {}) as EndConfig;
  const color = NODE_COLORS.end;

  return (
    <div style={{
      ...baseCard,
      borderColor: selected ? color : `${color}55`,
      boxShadow: selected ? `0 0 0 2px ${color}55` : baseCard.boxShadow,
    }}>
      <Handle type="target" position={Position.Top} style={{ background: color, width: 10, height: 10, border: '2px solid #fff' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ background: color, color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
          {NODE_ICONS.end} {NODE_LABELS.end}
        </span>
      </div>

      {config.reason && (
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{config.reason}</div>
      )}
      {/* No outgoing handle */}
    </div>
  );
}
