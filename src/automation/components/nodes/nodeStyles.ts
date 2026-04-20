// Central color/style registry for node types
export const NODE_COLORS: Record<string, string> = {
  trigger:       '#7c3aed',
  wait:          '#0284c7',
  condition:     '#d97706',
  email:         '#059669',
  update_status: '#0f766e',
  add_tag:       '#9333ea',
  webhook:       '#475569',
  end:           '#dc2626',
};

export const NODE_ICONS: Record<string, string> = {
  trigger:       '⚡',
  wait:          '⏱',
  condition:     '🔀',
  email:         '✉️',
  update_status: '✏️',
  add_tag:       '🏷️',
  webhook:       '🔗',
  end:           '🏁',
};

export const NODE_LABELS: Record<string, string> = {
  trigger:       'Tetikleyici',
  wait:          'Bekle',
  condition:     'Koşul',
  email:         'E-posta Gönder',
  update_status: 'Durum Güncelle',
  add_tag:       'Etiket Ekle',
  webhook:       'Webhook',
  end:           'Akış Sonu',
};

export const baseCard: React.CSSProperties = {
  background: '#fff',
  border: '2px solid',
  borderRadius: '10px',
  padding: '10px 14px',
  minWidth: '200px',
  maxWidth: '240px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
  fontFamily: 'Arial, sans-serif',
  cursor: 'pointer',
  userSelect: 'none',
};
