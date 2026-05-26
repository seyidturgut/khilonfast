// Transforms between React Flow internal state and our Automation JSON schema

import type { Node, Edge } from '@xyflow/react';
import type { AutomationNode, AutomationEdge, NodeConfig } from '../types';

export function flowNodesToAutomationNodes(flowNodes: Node[]): AutomationNode[] {
  return flowNodes.map(n => ({
    id: n.id,
    type: n.type as AutomationNode['type'],
    position: n.position,
    config: (n.data?.config ?? {}) as NodeConfig,
    label: n.data?.label as string | undefined,
  }));
}

export function automationNodesToFlowNodes(nodes: AutomationNode[]): Node[] {
  return nodes.map(n => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: {
      config: n.config,
      label: n.label,
    },
  }));
}

export function flowEdgesToAutomationEdges(flowEdges: Edge[]): AutomationEdge[] {
  return flowEdges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label as string | undefined,
  }));
}

export function automationEdgesToFlowEdges(edges: AutomationEdge[]): Edge[] {
  return edges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    type: 'smoothstep',
    animated: e.label === 'yes' || e.label === 'no',
    style: {
      stroke: e.label === 'yes' ? '#22c55e' : e.label === 'no' ? '#ef4444' : '#94a3b8',
      strokeWidth: 2,
    },
    labelStyle: { fill: e.label === 'yes' ? '#22c55e' : '#ef4444', fontWeight: 700, fontSize: 12 },
    labelBgStyle: { fill: '#fff' },
    markerEnd: { type: 'arrowclosed' as const },
  }));
}

export function delayLabel(type: string, value: number): string {
  const labels: Record<string, string> = { minutes: 'dakika', hours: 'saat', days: 'gün', weeks: 'hafta' };
  return `${value} ${labels[type] ?? type}`;
}

export function triggerEventLabel(event: string): string {
  const labels: Record<string, string> = {
    purchase_completed: 'Satın alma tamamlandı',
    checkout_email_entered: 'Ödeme e-postası girildi',
    checkout_abandoned: 'Sepet terk edildi',
    purchase_completed_no_onboarding: 'Aldı / Onboarding doldurmadı',
    onboarding_not_completed: 'Onboarding tamamlanmadı',
    service_not_used: 'Servis kullanılmadı',
    payment_failed: 'Ödeme başarısız',
    subscription_cancelled: 'Abonelik iptal edildi',
    course_purchased_not_started: 'Eğitim — Aldı, başlamadı',
    course_started_incomplete: 'Eğitim — Başladı, tamamlamadı',
    course_completed: 'Eğitim — Tamamlandı',
    course_yearly_reactivation: 'Eğitim — Yıllık reactivation',
    consulting_appointment: 'Danışmanlık — Randevu olayı',
    maestro_lifecycle: 'Maestro AI — Lifecycle',
    eyetracking_pending_upload: 'Eye Tracking — Görsel yükleme bekleniyor',
  };
  return labels[event] ?? event;
}

export function generateNodeId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function generateEdgeId(): string {
  return `edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}
