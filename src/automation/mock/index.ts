import type {
  Automation,
  EmailTemplate,
  AutomationLog,
  NodePaletteItem,
} from '../types';

// ─── Email Templates ────────────────────────────────────────

export const mockEmailTemplates: EmailTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Onboarding Hatırlatma 1',
    subject: 'Başlangıç Adımlarını Tamamlamayı Unutmayın, {{first_name}}!',
    preview_text: 'Platformu tam kapasite kullanmak için birkaç adım kaldı.',
    sender_name: 'Khilonfast Ekibi',
    sender_email: 'merhaba@khilonfast.com',
    body_html: `<h2>Merhaba {{first_name}},</h2>
<p>Satın alımınız tamamlandı, ancak başlangıç formunu henüz doldurmadığınızı fark ettik.</p>
<p>Hizmetinizi aktive etmek için birkaç dakikanızı ayırarak formu tamamlayın.</p>`,
    body_text: 'Merhaba {{first_name}}, Onboarding formunu tamamlamak için giriş yapın.',
    cta_label: 'Formu Tamamla',
    cta_url: '{{login_url}}',
    variables: ['first_name', 'login_url', 'service_name'],
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-10T12:00:00Z',
  },
  {
    id: 'tpl-2',
    name: 'Terk Edilen Sepet',
    subject: 'İşleminizi tamamlamak için sadece 1 adım kaldı!',
    preview_text: 'Sepetinizde ürünler sizi bekliyor.',
    sender_name: 'Khilonfast',
    sender_email: 'merhaba@khilonfast.com',
    body_html: `<h2>Merhaba {{first_name}},</h2>
<p>Satın alma işleminizi yarıda bıraktınız. Hâlâ ilgileniyor musunuz?</p>
<p>Sepetinizdeki ürünlere geri dönmek için aşağıdaki butona tıklayın.</p>`,
    body_text: 'Merhaba {{first_name}}, Sepetinize geri dönün.',
    cta_label: 'Sepete Dön',
    cta_url: '{{cart_url}}',
    variables: ['first_name', 'cart_url', 'order_id'],
    created_at: '2026-03-05T09:00:00Z',
    updated_at: '2026-03-05T09:00:00Z',
  },
  {
    id: 'tpl-3',
    name: 'Servis Kullanım Hatırlatması',
    subject: 'Hizmetinizi henüz kullanmadınız — Yardımcı olalım!',
    preview_text: 'Başlamanıza yardımcı olmak isteriz.',
    sender_name: 'Khilonfast Ekibi',
    sender_email: 'merhaba@khilonfast.com',
    body_html: `<h2>Merhaba {{first_name}},</h2>
<p>{{service_name}} hizmetini satın aldınız ancak henüz kullanmadınız.</p>
<p>Başlamak için uzman ekibimiz hazır. Bir tıkla randevu alın veya formu doldurun.</p>`,
    body_text: 'Merhaba {{first_name}}, Hizmetinizi kullanmaya başlayın.',
    cta_label: 'Başlamak İçin Tıkla',
    cta_url: '{{login_url}}',
    variables: ['first_name', 'service_name', 'login_url'],
    created_at: '2026-03-12T14:00:00Z',
    updated_at: '2026-03-12T14:00:00Z',
  },
];

// ─── Automations ────────────────────────────────────────────

export const mockAutomations: Automation[] = [
  {
    id: 'auto-1',
    name: 'Onboarding Hatırlatma Akışı',
    description: 'Satın alma sonrası form doldurmayan kullanıcılara hatırlatma gönderir.',
    status: 'active',
    version: 2,
    nodes: [
      {
        id: 'n1', type: 'trigger', position: { x: 300, y: 50 },
        config: { trigger_event: 'purchase_completed' },
      },
      {
        id: 'n2', type: 'wait', position: { x: 300, y: 180 },
        config: { delay_type: 'hours', delay_value: 1 },
      },
      {
        id: 'n3', type: 'condition', position: { x: 300, y: 310 },
        config: { field: 'onboarding_form_submitted', operator: 'is_false', value: '' },
      },
      {
        id: 'n4', type: 'email', position: { x: 100, y: 460 },
        config: { mode: 'template', template_id: 'tpl-1', subject: 'Onboarding Hatırlatma 1', sender_name: 'Khilonfast', sender_email: 'merhaba@khilonfast.com' },
      },
      {
        id: 'n5', type: 'wait', position: { x: 100, y: 590 },
        config: { delay_type: 'days', delay_value: 1 },
      },
      {
        id: 'n6', type: 'condition', position: { x: 100, y: 720 },
        config: { field: 'onboarding_form_submitted', operator: 'is_false', value: '' },
      },
      {
        id: 'n7', type: 'email', position: { x: 0, y: 870 },
        config: { mode: 'template', template_id: 'tpl-1', subject: 'Onboarding Hatırlatma 2', sender_name: 'Khilonfast', sender_email: 'merhaba@khilonfast.com' },
      },
      {
        id: 'n8', type: 'wait', position: { x: 0, y: 1000 },
        config: { delay_type: 'days', delay_value: 30 },
      },
      {
        id: 'n9', type: 'update_status', position: { x: 0, y: 1130 },
        config: { target_type: 'service', field_name: 'status', value: 'paused' },
      },
      {
        id: 'n10', type: 'end', position: { x: 300, y: 460 },
        config: { reason: 'Form zaten tamamlandı' },
      },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4', label: 'yes' },
      { id: 'e4', source: 'n3', target: 'n10', label: 'no' },
      { id: 'e5', source: 'n4', target: 'n5' },
      { id: 'e6', source: 'n5', target: 'n6' },
      { id: 'e7', source: 'n6', target: 'n7', label: 'yes' },
      { id: 'e8', source: 'n7', target: 'n8' },
      { id: 'e9', source: 'n8', target: 'n9' },
    ],
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-04-01T08:00:00Z',
  },
  {
    id: 'auto-2',
    name: 'Terk Edilen Sepet Akışı',
    description: 'E-posta giren ancak satın alma yapmayan kullanıcılara hatırlatma gönderir.',
    status: 'active',
    version: 1,
    nodes: [
      {
        id: 'n1', type: 'trigger', position: { x: 300, y: 50 },
        config: { trigger_event: 'checkout_email_entered' },
      },
      {
        id: 'n2', type: 'wait', position: { x: 300, y: 180 },
        config: { delay_type: 'hours', delay_value: 1 },
      },
      {
        id: 'n3', type: 'condition', position: { x: 300, y: 310 },
        config: { field: 'purchase_completed', operator: 'is_false', value: '' },
      },
      {
        id: 'n4', type: 'email', position: { x: 100, y: 460 },
        config: { mode: 'template', template_id: 'tpl-2', subject: 'Sepetiniz sizi bekliyor', sender_name: 'Khilonfast', sender_email: 'merhaba@khilonfast.com' },
      },
      {
        id: 'n5', type: 'add_tag', position: { x: 100, y: 590 },
        config: { target_type: 'contact', tag_name: 'abandoned_checkout' },
      },
      {
        id: 'n6', type: 'end', position: { x: 100, y: 720 },
        config: { reason: 'Akış tamamlandı' },
      },
      {
        id: 'n7', type: 'end', position: { x: 450, y: 460 },
        config: { reason: 'Satın alma yapıldı' },
      },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4', label: 'yes' },
      { id: 'e4', source: 'n3', target: 'n7', label: 'no' },
      { id: 'e5', source: 'n4', target: 'n5' },
      { id: 'e6', source: 'n5', target: 'n6' },
    ],
    created_at: '2026-03-15T11:00:00Z',
    updated_at: '2026-03-20T09:30:00Z',
  },
  {
    id: 'auto-3',
    name: 'Servis Kullanım Takibi',
    description: 'Satın aldıktan 14 gün sonra servisi kullanmayan kullanıcılara email gönderir.',
    status: 'draft',
    version: 1,
    nodes: [
      {
        id: 'n1', type: 'trigger', position: { x: 300, y: 50 },
        config: { trigger_event: 'purchase_completed' },
      },
      {
        id: 'n2', type: 'wait', position: { x: 300, y: 180 },
        config: { delay_type: 'days', delay_value: 14 },
      },
      {
        id: 'n3', type: 'condition', position: { x: 300, y: 310 },
        config: { field: 'service_used', operator: 'is_false', value: '' },
      },
      {
        id: 'n4', type: 'email', position: { x: 100, y: 460 },
        config: { mode: 'template', template_id: 'tpl-3', subject: 'Hizmetinize başlamak için yardımcı olalım', sender_name: 'Khilonfast', sender_email: 'merhaba@khilonfast.com' },
      },
      {
        id: 'n5', type: 'end', position: { x: 100, y: 590 },
        config: { reason: 'Email gönderildi' },
      },
      {
        id: 'n6', type: 'end', position: { x: 450, y: 460 },
        config: { reason: 'Servis zaten kullanılıyor' },
      },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4', label: 'yes' },
      { id: 'e4', source: 'n3', target: 'n6', label: 'no' },
      { id: 'e5', source: 'n4', target: 'n5' },
    ],
    created_at: '2026-04-01T15:00:00Z',
    updated_at: '2026-04-01T15:00:00Z',
  },
];

// ─── Logs ───────────────────────────────────────────────────

export const mockLogs: AutomationLog[] = [
  {
    id: 'log-1',
    automation_id: 'auto-1',
    automation_name: 'Onboarding Hatırlatma Akışı',
    contact_id: 'usr-42',
    contact_email: 'ali@example.com',
    status: 'completed',
    current_step: 'end',
    last_action: 'Email gönderildi: Onboarding Hatırlatma 1',
    triggered_event: 'purchase_completed',
    steps: [
      { node_id: 'n1', node_type: 'trigger', label: 'Tetikleyici: purchase_completed', executed_at: '2026-04-05T10:00:00Z', result: 'success' },
      { node_id: 'n2', node_type: 'wait', label: '1 saat beklendi', executed_at: '2026-04-05T11:00:00Z', result: 'success' },
      { node_id: 'n3', node_type: 'condition', label: 'onboarding_form_submitted = false → YES', executed_at: '2026-04-05T11:00:05Z', result: 'success' },
      { node_id: 'n4', node_type: 'email', label: 'Email gönderildi: Onboarding Hatırlatma 1', executed_at: '2026-04-05T11:00:10Z', result: 'success' },
    ],
    created_at: '2026-04-05T10:00:00Z',
    updated_at: '2026-04-05T11:00:10Z',
  },
  {
    id: 'log-2',
    automation_id: 'auto-2',
    automation_name: 'Terk Edilen Sepet Akışı',
    contact_id: 'usr-88',
    contact_email: 'zeynep@example.com',
    status: 'running',
    current_step: 'n3 - Koşul değerlendiriliyor',
    last_action: '1 saat beklendi',
    triggered_event: 'checkout_email_entered',
    steps: [
      { node_id: 'n1', node_type: 'trigger', label: 'Tetikleyici: checkout_email_entered', executed_at: '2026-04-08T14:00:00Z', result: 'success' },
      { node_id: 'n2', node_type: 'wait', label: '1 saat beklendi', executed_at: '2026-04-08T15:00:00Z', result: 'success' },
    ],
    created_at: '2026-04-08T14:00:00Z',
    updated_at: '2026-04-08T15:00:00Z',
  },
  {
    id: 'log-3',
    automation_id: 'auto-1',
    automation_name: 'Onboarding Hatırlatma Akışı',
    contact_id: 'usr-55',
    contact_email: 'mert@example.com',
    status: 'failed',
    current_step: 'n4 - Email',
    last_action: 'Email gönderilemedi',
    triggered_event: 'purchase_completed',
    error: 'SMTP bağlantısı başarısız: Connection refused',
    steps: [
      { node_id: 'n1', node_type: 'trigger', label: 'Tetikleyici: purchase_completed', executed_at: '2026-04-07T09:00:00Z', result: 'success' },
      { node_id: 'n2', node_type: 'wait', label: '1 saat beklendi', executed_at: '2026-04-07T10:00:00Z', result: 'success' },
      { node_id: 'n3', node_type: 'condition', label: 'Koşul: YES', executed_at: '2026-04-07T10:00:05Z', result: 'success' },
      { node_id: 'n4', node_type: 'email', label: 'Email gönderimi başarısız', executed_at: '2026-04-07T10:00:10Z', result: 'failed', detail: 'SMTP bağlantısı başarısız' },
    ],
    created_at: '2026-04-07T09:00:00Z',
    updated_at: '2026-04-07T10:00:10Z',
  },
];

// ─── Node Palette ────────────────────────────────────────────

export const nodePalette: NodePaletteItem[] = [
  { type: 'trigger',       label: 'Tetikleyici',     description: 'Akışı başlatan olay',           color: '#7c3aed', icon: '⚡' },
  { type: 'wait',          label: 'Bekle',            description: 'Belirli süre bekle',            color: '#0284c7', icon: '⏱' },
  { type: 'condition',     label: 'Koşul',            description: 'Dallanma mantığı (E/H)',        color: '#d97706', icon: '🔀' },
  { type: 'email',         label: 'E-posta Gönder',  description: 'Şablon veya özel e-posta',      color: '#059669', icon: '✉️' },
  { type: 'update_status', label: 'Durum Güncelle',  description: 'Kayıt durumunu değiştir',       color: '#0f766e', icon: '✏️' },
  { type: 'add_tag',       label: 'Etiket Ekle',     description: 'Kişi veya siparişe etiket',     color: '#9333ea', icon: '🏷️' },
  { type: 'webhook',       label: 'Webhook',          description: 'Harici sisteme istek gönder',  color: '#475569', icon: '🔗' },
  { type: 'end',           label: 'Akış Sonu',        description: 'Akışı sonlandır',              color: '#dc2626', icon: '🏁' },
];
