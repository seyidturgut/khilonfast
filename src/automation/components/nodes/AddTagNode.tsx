import { Handle, Position, type NodeProps } from '@xyflow/react';
import { NODE_COLORS, NODE_ICONS, NODE_LABELS, baseCard } from './nodeStyles';
import type { AddTagConfig } from '../../types';

export default function AddTagNode({ data, selected }: NodeProps) {
  const config = (data?.config ?? {}) as AddTagConfig;
  const color = NODE_COLORS.add_tag;

  return (
    <div style={{
      ...baseCard,
      borderColor: selected ? color : `${color}55`,
      boxShadow: selected ? `0 0 0 2px ${color}55` : baseCard.boxShadow,
    }}>
      <Handle type="target" position={Position.Top} style={{ background: color, width: 10, height: 10, border: '2px solid #fff' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ background: color, color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
          {NODE_ICONS.add_tag} {NODE_LABELS.add_tag}
        </span>
      </div>

      <div style={{ fontSize: 12, color: '#334155' }}>
        {config.tag_name
          ? <><strong>{config.target_type ?? 'contact'}</strong> → <span style={{ background: '#f3e8ff', color: '#7e22ce', padding: '1px 6px', borderRadius: 10, fontSize: 11 }}>{config.tag_name}</span></>
          : <em style={{ color: '#94a3b8' }}>Etiket tanımlanmadı</em>}
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: color, width: 10, height: 10, border: '2px solid #fff' }} />
    </div>
  );
}
