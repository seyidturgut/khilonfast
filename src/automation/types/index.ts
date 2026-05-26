// ============================================================
// Automation Builder — Core Types
// ============================================================

// ─── Node Types ─────────────────────────────────────────────

export type AutomationNodeType =
  | 'trigger'
  | 'wait'
  | 'condition'
  | 'email'
  | 'update_status'
  | 'add_tag'
  | 'webhook'
  | 'end';

// ─── Trigger ────────────────────────────────────────────────

export type TriggerEvent =
  | 'purchase_completed'
  | 'checkout_email_entered'
  | 'checkout_abandoned'
  | 'purchase_completed_no_onboarding'
  | 'onboarding_not_completed'
  | 'service_not_used'
  | 'payment_failed'
  | 'subscription_cancelled'
  | 'course_purchased_not_started'
  | 'course_started_incomplete'
  | 'course_completed'
  | 'course_yearly_reactivation'
  | 'consulting_appointment'
  | 'maestro_lifecycle'
  | 'eyetracking_pending_upload';

export interface TriggerConfig {
  trigger_event: TriggerEvent;
  description?: string;
}

// ─── Wait ───────────────────────────────────────────────────

export type DelayType = 'minutes' | 'hours' | 'days' | 'weeks';

export interface WaitConfig {
  delay_type: DelayType;
  delay_value: number;
}

// ─── Condition ──────────────────────────────────────────────

export type ConditionField =
  | 'onboarding_form_submitted'
  | 'purchase_completed'
  | 'service_used'
  | 'email_verified'
  | 'customer_tag'
  | 'service_status'
  | 'payment_status';

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'is_true'
  | 'is_false';

export interface ConditionConfig {
  field: ConditionField;
  operator: ConditionOperator;
  value: string;
}

// ─── Email ──────────────────────────────────────────────────

export type EmailMode = 'template' | 'custom';

export interface EmailConfig {
  mode: EmailMode;
  template_id?: string;
  subject: string;
  preview_text?: string;
  sender_name: string;
  sender_email: string;
  body_html?: string;
  body_text?: string;
  cta_label?: string;
  cta_url?: string;
}

// ─── Update Status ──────────────────────────────────────────

export type UpdateStatusTargetType = 'contact' | 'order' | 'service' | 'customer';

export interface UpdateStatusConfig {
  target_type: UpdateStatusTargetType;
  field_name: string;
  value: string;
}

// ─── Add Tag ────────────────────────────────────────────────

export interface AddTagConfig {
  target_type: UpdateStatusTargetType;
  tag_name: string;
}

// ─── Webhook ────────────────────────────────────────────────

export type WebhookMethod = 'GET' | 'POST' | 'PUT' | 'PATCH';

export interface WebhookConfig {
  url: string;
  method: WebhookMethod;
  payload_template?: string;
}

// ─── End ────────────────────────────────────────────────────

export interface EndConfig {
  reason?: string;
}

// ─── Union Config ───────────────────────────────────────────

export type NodeConfig =
  | TriggerConfig
  | WaitConfig
  | ConditionConfig
  | EmailConfig
  | UpdateStatusConfig
  | AddTagConfig
  | WebhookConfig
  | EndConfig;

// ─── Automation Node ────────────────────────────────────────

export interface AutomationNode {
  id: string;
  type: AutomationNodeType;
  position: { x: number; y: number };
  config: NodeConfig;
  label?: string;
}

// ─── Automation Edge ────────────────────────────────────────

export interface AutomationEdge {
  id: string;
  source: string;
  target: string;
  label?: 'yes' | 'no' | string;
}

// ─── Automation Status ──────────────────────────────────────

export type AutomationStatus = 'draft' | 'active' | 'inactive';

// ─── Automation ─────────────────────────────────────────────

export interface Automation {
  id: string;
  name: string;
  description?: string;
  status: AutomationStatus;
  version: number;
  nodes: AutomationNode[];
  edges: AutomationEdge[];
  created_at: string;
  updated_at: string;
}

// ─── Validation ─────────────────────────────────────────────

export interface ValidationError {
  node_id?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ─── Email Template ─────────────────────────────────────────

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  preview_text?: string;
  sender_name: string;
  sender_email: string;
  body_html: string;
  body_text?: string;
  design_json?: string;   // Unlayer JSON design (for re-editing)
  cta_label?: string;
  cta_url?: string;
  variables: string[];
  created_at: string;
  updated_at: string;
}

// ─── Automation Log ─────────────────────────────────────────

export type LogStatus = 'running' | 'completed' | 'failed' | 'paused';

export interface AutomationLogStep {
  node_id: string;
  node_type: AutomationNodeType;
  label: string;
  executed_at: string;
  result: 'success' | 'skipped' | 'failed';
  detail?: string;
}

export interface AutomationLog {
  id: string;
  automation_id: string;
  automation_name: string;
  contact_id?: string;
  contact_email?: string;
  status: LogStatus;
  current_step: string;
  last_action: string;
  steps: AutomationLogStep[];
  error?: string;
  triggered_event: TriggerEvent;
  created_at: string;
  updated_at: string;
}

// ─── Node Palette Item (for sidebar) ────────────────────────

export interface NodePaletteItem {
  type: AutomationNodeType;
  label: string;
  description: string;
  color: string;
  icon: string;
}
