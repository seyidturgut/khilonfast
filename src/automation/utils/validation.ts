import type {
  AutomationNode,
  AutomationEdge,
  ValidationResult,
  ValidationError,
  NodeConfig,
  TriggerConfig,
  WaitConfig,
  ConditionConfig,
  EmailConfig,
  UpdateStatusConfig,
  AddTagConfig,
  WebhookConfig,
} from '../types';

export function validateAutomation(
  nodes: AutomationNode[],
  edges: AutomationEdge[]
): ValidationResult {
  const errors: ValidationError[] = [];

  if (nodes.length === 0) {
    return { valid: false, errors: [{ message: 'Akış en az bir node içermelidir.', severity: 'error' }] };
  }

  // 1. Exactly one trigger
  const triggers = nodes.filter(n => n.type === 'trigger');
  if (triggers.length === 0) {
    errors.push({ message: 'Akışın başlaması için bir Tetikleyici node gereklidir.', severity: 'error' });
  } else if (triggers.length > 1) {
    errors.push({ message: 'Akışta yalnızca bir Tetikleyici node olabilir.', severity: 'error' });
  }

  // 2. Trigger cannot have incoming edge
  triggers.forEach(t => {
    const hasIncoming = edges.some(e => e.target === t.id);
    if (hasIncoming) {
      errors.push({ node_id: t.id, message: 'Tetikleyici node\'a gelen bağlantı olamaz.', severity: 'error' });
    }
  });

  // 3. End node cannot have outgoing edge
  nodes.filter(n => n.type === 'end').forEach(end => {
    const hasOutgoing = edges.some(e => e.source === end.id);
    if (hasOutgoing) {
      errors.push({ node_id: end.id, message: 'Akış Sonu node\'undan çıkan bağlantı olamaz.', severity: 'error' });
    }
  });

  // 4. Non-condition nodes should have max one outgoing edge
  const singleOutputTypes = ['trigger', 'wait', 'email', 'update_status', 'add_tag', 'webhook'];
  singleOutputTypes.forEach(type => {
    nodes.filter(n => n.type === type).forEach(node => {
      const outgoing = edges.filter(e => e.source === node.id);
      if (outgoing.length > 1) {
        errors.push({ node_id: node.id, message: `${node.type} node'u yalnızca bir çıkış bağlantısına sahip olabilir.`, severity: 'error' });
      }
    });
  });

  // 5. Condition node should have yes and no outputs
  nodes.filter(n => n.type === 'condition').forEach(node => {
    const outgoing = edges.filter(e => e.source === node.id);
    const hasYes = outgoing.some(e => e.label === 'yes');
    const hasNo  = outgoing.some(e => e.label === 'no');
    if (!hasYes) {
      errors.push({ node_id: node.id, message: 'Koşul node\'u bir "Evet" çıkışı gerektirir.', severity: 'error' });
    }
    if (!hasNo) {
      errors.push({ node_id: node.id, message: 'Koşul node\'u bir "Hayır" çıkışı gerektirir.', severity: 'warning' });
    }
  });

  // 6. Disconnected nodes (not trigger, not end)
  const connectedIds = new Set<string>();
  edges.forEach(e => { connectedIds.add(e.source); connectedIds.add(e.target); });
  nodes.filter(n => n.type !== 'trigger' && n.type !== 'end').forEach(node => {
    if (!connectedIds.has(node.id)) {
      errors.push({ node_id: node.id, message: `Node bağlantısız: ${node.type}`, severity: 'error' });
    }
  });

  // 7. Config validation per node
  nodes.forEach(node => {
    const configErrors = validateNodeConfig(node.id, node.type, node.config);
    errors.push(...configErrors);
  });

  return {
    valid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
  };
}

function validateNodeConfig(
  nodeId: string,
  type: string,
  config: NodeConfig
): ValidationError[] {
  const errors: ValidationError[] = [];
  // config null/undefined olabilir (eski seed verileri) — boş objeyle çalış
  const safe = (config ?? {}) as Record<string, unknown>;

  switch (type) {
    case 'trigger': {
      const c = safe as unknown as TriggerConfig;
      if (!c.trigger_event) {
        errors.push({ node_id: nodeId, message: 'Tetikleyici olayı seçilmedi.', severity: 'error' });
      }
      break;
    }
    case 'wait': {
      const c = safe as unknown as WaitConfig;
      if (!c.delay_type || !c.delay_value || c.delay_value <= 0) {
        errors.push({ node_id: nodeId, message: 'Geçerli bir bekleme süresi girin.', severity: 'error' });
      }
      break;
    }
    case 'condition': {
      const c = safe as unknown as ConditionConfig;
      if (!c.field || !c.operator) {
        errors.push({ node_id: nodeId, message: 'Koşul alanı ve operatör gereklidir.', severity: 'error' });
      }
      break;
    }
    case 'email': {
      const c = safe as unknown as EmailConfig;
      if (!c.subject || !c.sender_email) {
        errors.push({ node_id: nodeId, message: 'E-posta konusu ve gönderen adresi gereklidir.', severity: 'error' });
      }
      if (c.mode === 'template' && !c.template_id) {
        errors.push({ node_id: nodeId, message: 'Şablon modunda bir şablon seçilmelidir.', severity: 'error' });
      }
      break;
    }
    case 'update_status': {
      const c = safe as unknown as UpdateStatusConfig;
      if (!c.target_type || !c.field_name || !c.value) {
        errors.push({ node_id: nodeId, message: 'Hedef, alan adı ve değer gereklidir.', severity: 'error' });
      }
      break;
    }
    case 'add_tag': {
      const c = safe as unknown as AddTagConfig;
      if (!c.target_type || !c.tag_name) {
        errors.push({ node_id: nodeId, message: 'Hedef ve etiket adı gereklidir.', severity: 'error' });
      }
      break;
    }
    case 'webhook': {
      const c = safe as unknown as WebhookConfig;
      if (!c.url || !c.method) {
        errors.push({ node_id: nodeId, message: 'Webhook URL ve metodu gereklidir.', severity: 'error' });
      }
      break;
    }
  }
  return errors;
}
