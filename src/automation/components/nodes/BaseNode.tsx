import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { NODE_COLORS, NODE_ICONS, NODE_LABELS, baseCard } from './nodeStyles';

interface BaseNodeProps {
  id: string;
  type: string;
  selected?: boolean;
  children: React.ReactNode;
  showTopHandle?: boolean;
  showBottomHandle?: boolean;
  extraHandles?: React.ReactNode;
}

export default function BaseNode({
  type,
  selected,
  children,
  showTopHandle = true,
  showBottomHandle = true,
  extraHandles,
}: BaseNodeProps) {
  const color = NODE_COLORS[type] ?? '#64748b';
  const icon  = NODE_ICONS[type]  ?? '●';
  const label = NODE_LABELS[type] ?? type;

  return (
    <div
      style={{
        ...baseCard,
        borderColor: selected ? color : `${color}55`,
        boxShadow: selected ? `0 0 0 2px ${color}55, 0 4px 12px rgba(0,0,0,0.12)` : baseCard.boxShadow,
      }}
    >
      {showTopHandle && (
        <Handle
          type="target"
          position={Position.Top}
          style={{ background: color, width: 10, height: 10, border: `2px solid #fff` }}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{
          background: color,
          color: '#fff',
          borderRadius: '6px',
          padding: '2px 6px',
          fontSize: 11,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 3,
        }}>
          {icon} {label}
        </span>
      </div>

      {/* Content */}
      <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.5 }}>
        {children}
      </div>

      {showBottomHandle && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ background: color, width: 10, height: 10, border: '2px solid #fff' }}
        />
      )}

      {extraHandles}
    </div>
  );
}
