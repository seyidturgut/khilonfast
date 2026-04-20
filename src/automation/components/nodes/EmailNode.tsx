import { Handle, Position, type NodeProps } from '@xyflow/react';
import { NODE_COLORS, NODE_ICONS, NODE_LABELS, baseCard } from './nodeStyles';
import type { EmailConfig } from '../../types';

export default function EmailNode({ data, selected }: NodeProps) {
  const config = (data?.config ?? {}) as EmailConfig;
  const color = NODE_COLORS.email;

  return (
    <div style={{
      ...baseCard,
      borderColor: selected ? color : `${color}55`,
      boxShadow: selected ? `0 0 0 2px ${color}55` : baseCard.boxShadow,
    }}>
      <Handle type="target" position={Position.Top} style={{ background: color, width: 10, height: 10, border: '2px solid #fff' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ background: color, color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
          {NODE_ICONS.email} {NODE_LABELS.email}
        </span>
        <span style={{
          fontSize: 10, background: config.mode === 'template' ? '#d1fae5' : '#e0f2fe',
          color: config.mode === 'template' ? '#065f46' : '#0369a1',
          borderRadius: 4, padding: '1px 6px', fontWeight: 600,
        }}>
          {config.mode === 'template' ? 'Şablon' : 'Özel'}
        </span>
      </div>

      <div style={{ fontSize: 12, color: '#334155' }}>
        {config.subject
          ? <div><strong>{config.subject}</strong></div>
          : <em style={{ color: '#94a3b8' }}>Konu belirtilmedi</em>}
        {config.sender_email && (
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Gönderen: {config.sender_email}</div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: color, width: 10, height: 10, border: '2px solid #fff' }} />
    </div>
  );
}
