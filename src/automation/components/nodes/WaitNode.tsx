import { Handle, Position, type NodeProps } from '@xyflow/react';
import { NODE_COLORS, NODE_ICONS, NODE_LABELS, baseCard } from './nodeStyles';
import { delayLabel } from '../../utils/transform';
import type { WaitConfig } from '../../types';

export default function WaitNode({ data, selected }: NodeProps) {
  const config = (data?.config ?? {}) as WaitConfig;
  const color = NODE_COLORS.wait;
  const summary = config.delay_value && config.delay_type
    ? delayLabel(config.delay_type, config.delay_value)
    : null;

  return (
    <div style={{
      ...baseCard,
      borderColor: selected ? color : `${color}55`,
      boxShadow: selected ? `0 0 0 2px ${color}55` : baseCard.boxShadow,
    }}>
      <Handle type="target" position={Position.Top} style={{ background: color, width: 10, height: 10, border: '2px solid #fff' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ background: color, color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
          {NODE_ICONS.wait} {NODE_LABELS.wait}
        </span>
      </div>
      <div style={{ fontSize: 12, color: '#334155' }}>
        {summary
          ? <><strong>{summary}</strong> bekle</>
          : <em style={{ color: '#94a3b8' }}>Süre ayarlanmadı</em>}
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: color, width: 10, height: 10, border: '2px solid #fff' }} />
    </div>
  );
}
