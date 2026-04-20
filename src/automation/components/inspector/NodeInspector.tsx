import { useState, useEffect } from 'react';
import type { Node } from '@xyflow/react';
import type { AutomationNodeType, NodeConfig } from '../../types';
import { NODE_COLORS, NODE_ICONS, NODE_LABELS } from '../nodes/nodeStyles';
import TriggerForm from './forms/TriggerForm';
import WaitForm from './forms/WaitForm';
import ConditionForm from './forms/ConditionForm';
import EmailForm from './forms/EmailForm';
import UpdateStatusForm from './forms/UpdateStatusForm';
import AddTagForm from './forms/AddTagForm';
import WebhookForm from './forms/WebhookForm';
import EndForm from './forms/EndForm';

interface NodeInspectorProps {
  node: Node | null;
  onUpdate: (nodeId: string, config: NodeConfig) => void;
  onDelete: (nodeId: string) => void;
}

export default function NodeInspector({ node, onUpdate, onDelete }: NodeInspectorProps) {
  const [localConfig, setLocalConfig] = useState<NodeConfig>({} as NodeConfig);

  useEffect(() => {
    if (node) setLocalConfig((node.data?.config ?? {}) as NodeConfig);
  }, [node?.id]);

  if (!node) {
    return (
      <div style={{
        width: 260, background: '#f8fafc', borderLeft: '1px solid #e2e8f0',
        padding: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>👆</div>
          <div style={{ fontSize: 13 }}>Düzenlemek için<br />bir node seçin</div>
        </div>
      </div>
    );
  }

  const type = node.type as AutomationNodeType;
  const color = NODE_COLORS[type] ?? '#64748b';

  const handleChange = (config: NodeConfig) => {
    setLocalConfig(config);
  };

  const handleSave = () => {
    onUpdate(node.id, localConfig);
  };

  const renderForm = () => {
    const props = { config: localConfig as any, onChange: handleChange as any };
    switch (type) {
      case 'trigger':       return <TriggerForm {...props} />;
      case 'wait':          return <WaitForm {...props} />;
      case 'condition':     return <ConditionForm {...props} />;
      case 'email':         return <EmailForm {...props} />;
      case 'update_status': return <UpdateStatusForm {...props} />;
      case 'add_tag':       return <AddTagForm {...props} />;
      case 'webhook':       return <WebhookForm {...props} />;
      case 'end':           return <EndForm {...props} />;
      default:              return <div style={{ color: '#94a3b8', fontSize: 12 }}>Bu node tipi için form yok.</div>;
    }
  };

  return (
    <div style={{
      width: 260, background: '#f8fafc', borderLeft: '1px solid #e2e8f0',
      padding: 16, flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ background: color, color: '#fff', borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 700 }}>
            {NODE_ICONS[type]} {NODE_LABELS[type]}
          </span>
        </div>
        <button
          onClick={() => onDelete(node.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 16, padding: 4 }}
          title="Node'u sil"
        >
          🗑
        </button>
      </div>

      <div style={{ fontSize: 11, color: '#94a3b8' }}>ID: {node.id}</div>

      {/* Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {renderForm()}
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        style={{
          marginTop: 8, padding: '8px 0', background: color, color: '#fff',
          border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13,
          cursor: 'pointer', width: '100%',
        }}
      >
        Kaydet
      </button>
    </div>
  );
}
