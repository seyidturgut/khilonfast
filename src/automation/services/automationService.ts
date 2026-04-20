// ============================================================
// Automation Service — Real API implementation
// All data persisted to MySQL via /api/admin/* endpoints
// ============================================================

import { API_BASE_URL } from '../../config/api';
import type {
  Automation,
  AutomationStatus,
  EmailTemplate,
  AutomationLog,
  ValidationResult,
  AutomationNode,
  AutomationEdge,
} from '../types';
import { validateAutomation } from '../utils/validation';

// ─── Fetch helper ─────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token') ?? '';
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  let body: unknown;
  try { body = await res.json(); } catch { body = {}; }

  if (!res.ok) {
    const msg = (body as { error?: string })?.error ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body as T;
}

// ─── Normalizers ──────────────────────────────────────────────

function normalizeAutomation(raw: Record<string, unknown>): Automation {
  return {
    id:          String(raw.id),
    name:        raw.name as string,
    description: raw.description as string | undefined,
    status:      raw.status as AutomationStatus,
    version:     Number(raw.version ?? 1),
    nodes:       (raw.nodes as AutomationNode[]) ?? [],
    edges:       (raw.edges as AutomationEdge[]) ?? [],
    created_at:  raw.created_at as string,
    updated_at:  raw.updated_at as string,
  };
}

function normalizeTemplate(raw: Record<string, unknown>): EmailTemplate {
  return {
    id:           String(raw.id),
    name:         raw.name as string,
    subject:      raw.subject as string,
    preview_text: raw.preview_text as string | undefined,
    sender_name:  (raw.sender_name as string) ?? 'Khilonfast',
    sender_email: (raw.sender_email as string) ?? 'merhaba@khilonfast.com',
    body_html:    (raw.body_html as string) ?? '',
    body_text:    raw.body_text as string | undefined,
    design_json:  raw.design_json as string | undefined,
    cta_label:    raw.cta_label as string | undefined,
    cta_url:      raw.cta_url as string | undefined,
    variables:    (raw.variables as string[]) ?? [],
    created_at:   raw.created_at as string,
    updated_at:   raw.updated_at as string,
  };
}

// ─── Automation CRUD ──────────────────────────────────────────

export async function getAutomations(): Promise<Automation[]> {
  const data = await apiFetch<{ automations: Record<string, unknown>[] }>('/admin/automations');
  return (data.automations ?? []).map(normalizeAutomation);
}

export async function getAutomationById(id: string): Promise<Automation | null> {
  try {
    const data = await apiFetch<{ automation: Record<string, unknown> }>(`/admin/automations/${id}`);
    return normalizeAutomation(data.automation);
  } catch {
    return null;
  }
}

export async function createAutomation(
  name: string,
  description?: string
): Promise<Automation> {
  const data = await apiFetch<{ automation: Record<string, unknown> }>(
    '/admin/automations',
    { method: 'POST', body: JSON.stringify({ name, description }) }
  );
  return normalizeAutomation(data.automation);
}

export async function updateAutomation(
  id: string,
  updates: Partial<Pick<Automation, 'name' | 'description' | 'nodes' | 'edges'>>
): Promise<Automation> {
  const data = await apiFetch<{ automation: Record<string, unknown> }>(
    `/admin/automations/${id}`,
    { method: 'PUT', body: JSON.stringify(updates) }
  );
  return normalizeAutomation(data.automation);
}

export async function deleteAutomation(id: string): Promise<void> {
  await apiFetch(`/admin/automations/${id}`, { method: 'DELETE' });
}

export async function duplicateAutomation(id: string): Promise<Automation> {
  const data = await apiFetch<{ automation: Record<string, unknown> }>(
    `/admin/automations/${id}/duplicate`,
    { method: 'POST' }
  );
  return normalizeAutomation(data.automation);
}

export async function activateAutomation(id: string): Promise<Automation> {
  // Client-side validation before hitting the API
  const auto = await getAutomationById(id);
  if (auto) {
    const result = validateAutomation(auto.nodes, auto.edges);
    if (!result.valid) {
      const errs = result.errors
        .filter(e => e.severity === 'error')
        .map(e => `• ${e.message}`)
        .join('\n');
      throw new Error(`Aktivasyon için doğrulama hatalarını düzeltin:\n${errs}`);
    }
  }
  const data = await apiFetch<{ automation: Record<string, unknown> }>(
    `/admin/automations/${id}/activate`,
    { method: 'POST' }
  );
  return normalizeAutomation(data.automation);
}

export async function deactivateAutomation(id: string): Promise<Automation> {
  const data = await apiFetch<{ automation: Record<string, unknown> }>(
    `/admin/automations/${id}/deactivate`,
    { method: 'POST' }
  );
  return normalizeAutomation(data.automation);
}

export async function validateAutomationById(id: string): Promise<ValidationResult> {
  const auto = await getAutomationById(id);
  if (!auto) throw new Error('Automation bulunamadı');
  return validateAutomation(auto.nodes, auto.edges);
}

export function validateFlow(
  nodes: AutomationNode[],
  edges: AutomationEdge[]
): ValidationResult {
  return validateAutomation(nodes, edges);
}

// ─── Email Templates ──────────────────────────────────────────

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  const data = await apiFetch<{ templates: Record<string, unknown>[] }>('/admin/automation-templates');
  return (data.templates ?? []).map(normalizeTemplate);
}

export async function getEmailTemplateById(id: string): Promise<EmailTemplate | null> {
  try {
    const all = await getEmailTemplates();
    return all.find(t => t.id === id) ?? null;
  } catch {
    return null;
  }
}

export async function createEmailTemplate(
  tpl: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>
): Promise<EmailTemplate> {
  const data = await apiFetch<{ template: Record<string, unknown> }>(
    '/admin/automation-templates',
    { method: 'POST', body: JSON.stringify(tpl) }
  );
  return normalizeTemplate(data.template);
}

export async function updateEmailTemplate(
  id: string,
  tpl: Partial<Omit<EmailTemplate, 'id' | 'created_at'>>
): Promise<EmailTemplate> {
  const data = await apiFetch<{ template: Record<string, unknown> }>(
    `/admin/automation-templates/${id}`,
    { method: 'PUT', body: JSON.stringify(tpl) }
  );
  return normalizeTemplate(data.template);
}

export async function deleteEmailTemplate(id: string): Promise<void> {
  await apiFetch(`/admin/automation-templates/${id}`, { method: 'DELETE' });
}

// ─── Logs ─────────────────────────────────────────────────────
// Not yet persisted — placeholder until automation_logs table is added

export async function getLogs(_automationId?: string): Promise<AutomationLog[]> {
  return [];
}

export async function getLogById(_id: string): Promise<AutomationLog | null> {
  return null;
}
