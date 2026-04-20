import { Handle, Position, type NodeProps } from '@xyflow/react';
import { NODE_COLORS, NODE_ICONS, NODE_LABELS, baseCard } from './nodeStyles';
import type { WebhookConfig } from '../../types';

export default function WebhookNode({ data, selected }: NodeProps) {
  const config = (data?.config ?? {}) as WebhookConfig;
  const color = NODE_COLORS.webhook;

  return (
    <div style={{
      ...baseCard,
      borderColor: selected ? color : `${color}55`,
      boxShadow: selected ? `0 0 0 2px ${color}55` : baseCard.boxShadow,
    }}>
      <Handle type="target" position={Position.Top} style={{ background: color, width: 10, height: 10, border: '2px solid #fff' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ background: color, color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
          {NODE_ICONS.webhook} {NODE_LABELS.webhook}
        </span>
        {config.method && (
          <span style={{ fontSize: 10, background: '#f1f5f9', color: '#475569', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>
            {config.method}
          </span>
        )}
      </div>

      <div style={{ fontSize: 11, color: '#334155', wordBreak: 'break-all' }}>
        {config.url || <em style={{ color: '#94a3b8' }}>URL girilmedi</em>}
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: color, width: 10, height: 10, border: '2px solid #fff' }} />
    </div>
  );
}
