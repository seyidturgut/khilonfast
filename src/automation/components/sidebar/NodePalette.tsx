import { nodePalette } from '../../mock';
import { NODE_COLORS } from '../nodes/nodeStyles';
import type { AutomationNodeType } from '../../types';

interface NodePaletteProps {
  onDragStart: (type: AutomationNodeType) => void;
}

export default function NodePalette({ onDragStart }: NodePaletteProps) {
  return (
    <div style={{
      width: 200,
      background: '#f8fafc',
      borderRight: '1px solid #e2e8f0',
      padding: '12px 10px',
      overflowY: 'auto',
      flexShrink: 0,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
        Node Tipleri
      </div>

      {nodePalette.map(item => (
        <div
          key={item.type}
          draggable
          onDragStart={() => onDragStart(item.type)}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            padding: '8px 10px',
            marginBottom: 6,
            background: '#fff',
            border: `1.5px solid ${NODE_COLORS[item.type]}33`,
            borderLeft: `3px solid ${NODE_COLORS[item.type]}`,
            borderRadius: 8,
            cursor: 'grab',
            userSelect: 'none',
            transition: 'box-shadow 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 2px 8px ${NODE_COLORS[item.type]}33`)}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
        >
          <span style={{ fontSize: 16, lineHeight: 1, marginTop: 1 }}>{item.icon}</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{item.label}</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>{item.description}</div>
          </div>
        </div>
      ))}

      <div style={{ marginTop: 16, fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
        💡 Node'u sürükleyip canvas'a bırakın
      </div>
    </div>
  );
}
