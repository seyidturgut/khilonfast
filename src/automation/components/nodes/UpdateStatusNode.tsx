import { Handle, Position, type NodeProps } from '@xyflow/react';
import { NODE_COLORS, NODE_ICONS, NODE_LABELS, baseCard } from './nodeStyles';
import type { UpdateStatusConfig } from '../../types';

export default function UpdateStatusNode({ data, selected }: NodeProps) {
  const config = (data?.config ?? {}) as UpdateStatusConfig;
  const color = NODE_COLORS.update_status;

  return (
    <div style={{
      ...baseCard,
      borderColor: selected ? color : `${color}55`,
      boxShadow: selected ? `0 0 0 2px ${color}55` : baseCard.boxShadow,
    }}>
      <Handle type="target" position={Position.Top} style={{ background: color, width: 10, height: 10, border: '2px solid #fff' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ background: color, color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
          {NODE_ICONS.update_status} {NODE_LABELS.update_status}
        </span>
      </div>

      <div style={{ fontSize: 12, color: '#334155' }}>
        {config.target_type && config.field_name && config.value
          ? <><strong>{config.target_type}.{config.field_name}</strong> = <code style={{ background: '#f1f5f9', padding: '0 4px', borderRadius: 3 }}>{config.value}</code></>
          : <em style={{ color: '#94a3b8' }}>Yapılandırılmadı</em>}
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: color, width: 10, height: 10, border: '2px solid #fff' }} />
    </div>
  );
}
