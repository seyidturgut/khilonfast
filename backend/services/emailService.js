import nodemailer from 'nodemailer';
import db from '../config/database.js';

const parseBooleanLike = (value, fallback = false) => {
    if (value === null || value === undefined || value === '') return fallback;
    if (typeof value === 'boolean') return value;
    return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

const getMailSettings = async () => {
    const [rows] = await db.query(
        `SELECT setting_key, setting_value
         FROM settings
         WHERE setting_key IN ('smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_secure', 'contact_email')`
    );

    const map = rows.reduce((acc, row) => {
        acc[row.setting_key] = row.setting_value;
        return acc;
    }, {});

    return {
        host: map.smtp_host || process.env.SMTP_HOST,
        port: Number(map.smtp_port || process.env.SMTP_PORT || 465),
        user: map.smtp_user || process.env.SMTP_USER,
        pass: map.smtp_pass || process.env.SMTP_PASS,
        secure: parseBooleanLike(map.smtp_secure, Number(map.smtp_port || process.env.SMTP_PORT || 465) === 465),
        from: map.contact_email || process.env.SMTP_FROM || map.smtp_user || process.env.SMTP_USER
    };
};

const buildWelcomeEmailHtml = ({ firstName, email, temporaryPassword }) => `
<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Kayıt Tamamlandı</title>
</head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#102a43;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #d9e2ec;">
          <tr>
            <td style="background:linear-gradient(135deg,#0f766e,#0ea5a4);padding:20px 24px;color:#ffffff;">
              <h1 style="margin:0;font-size:22px;line-height:1.3;">Kayıt Tamamlandı</h1>
              <p style="margin:8px 0 0;font-size:14px;opacity:.95;">Khilonfast hesabınız oluşturuldu.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 14px;font-size:15px;">Merhaba ${firstName || 'Değerli Kullanıcı'},</p>
              <p style="margin:0 0 14px;font-size:15px;">Satın alma süreciniz sırasında hesabınız başarıyla oluşturuldu.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0;background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;">
                <tr>
                  <td style="padding:16px;">
                    <p style="margin:0 0 8px;font-size:14px;"><strong>E-posta:</strong> ${email}</p>
                    <p style="margin:0;font-size:14px;"><strong>Geçici Şifre:</strong> <span style="font-family:Consolas,monospace;background:#e0f2fe;padding:2px 6px;border-radius:6px;">${temporaryPassword}</span></p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 10px;font-size:14px;color:#334e68;">İlk girişinizden sonra güvenliğiniz için şifrenizi değiştirmeniz zorunludur.</p>
              <p style="margin:0;font-size:13px;color:#627d98;">Bu e-postayı siz talep etmediyseniz lütfen bizimle iletişime geçin.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const sendWelcomeAccountEmail = async ({ to, firstName, temporaryPassword }) => {
    const settings = await getMailSettings();

    if (!settings.host || !settings.user || !settings.pass || !settings.from) {
        throw new Error('SMTP ayarlari eksik');
    }

    const transporter = nodemailer.createTransport({
        host: settings.host,
        port: settings.port,
        secure: settings.secure,
        auth: {
            user: settings.user,
            pass: settings.pass
        }
    });

    await transporter.sendMail({
        from: settings.from,
        to,
        subject: 'Khilonfast - Kayit Tamamlandi',
        html: buildWelcomeEmailHtml({ firstName, email: to, temporaryPassword })
    });
};

const buildFormSummaryHtml = (formData) => {
    const sections = [
        { key: 'bolum1', title: 'Temel Bilgiler' }, { key: 'bolum2', title: 'İş & Ürün Tanımı' },
        { key: 'bolum3', title: 'Rekabet' }, { key: 'bolum4', title: 'Hedef Kitle & Organizasyon' },
        { key: 'bolum5', title: 'Müşteri İhtiyaç & Problem' }, { key: 'bolum6', title: 'Değer Önerileri' },
        { key: 'bolum7', title: 'Satın Alma Davranışı' }, { key: 'bolum8', title: 'Beklenti & Sonuç' },
        { key: 'bolum9', title: 'Kanal & Performans' }, { key: 'bolum10', title: 'Teknoloji & Altyapı' },
        { key: 'bolum11', title: 'Operasyon Süreci' }, { key: 'bolum12', title: 'Stratejik Gerçekler' },
    ];
    return sections.map(s => {
        const d = formData[s.key];
        if (!d) return '';
        const rows = Object.entries(d).filter(([, v]) => v)
            .map(([k, v]) => `<tr><td style="padding:4px 8px;color:#64748b;font-size:12px;width:38%;vertical-align:top">${k.replace(/_/g,' ')}</td><td style="padding:4px 8px;font-size:12px;color:#1e293b">${v}</td></tr>`).join('');
        if (!rows) return '';
        return `<h3 style="margin:14px 0 4px;font-size:12px;color:#0f766e;text-transform:uppercase">${s.title}</h3><table style="width:100%;border-collapse:collapse;background:#f8fafc">${rows}</table>`;
    }).join('');
};

export const sendOnboardingFormAdminEmail = async ({ to, userName, userEmail, productNames, formData }) => {
    const settings = await getMailSettings();
    if (!settings.host || !settings.user || !settings.pass) return;
    const transporter = nodemailer.createTransport({ host: settings.host, port: settings.port, secure: settings.secure, auth: { user: settings.user, pass: settings.pass } });
    await transporter.sendMail({
        from: settings.from, to,
        subject: `Yeni Onboarding Formu — ${userName}`,
        html: `<!doctype html><html lang="tr"><head><meta charset="utf-8"/></head><body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#102a43"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:24px 12px"><tr><td align="center"><table role="presentation" width="620" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #d9e2ec"><tr><td style="background:linear-gradient(135deg,#0f766e,#0ea5a4);padding:20px 24px;color:#fff"><h1 style="margin:0;font-size:20px">Yeni Onboarding Formu</h1><p style="margin:6px 0 0;font-size:13px;opacity:.9">${userName} — ${userEmail}</p></td></tr><tr><td style="padding:20px 24px">${productNames ? `<p style="margin:0 0 12px;font-size:14px;color:#334e68"><strong>Satın Alınan Hizmet:</strong> ${productNames}</p>` : ''}${buildFormSummaryHtml(formData)}</td></tr></table></td></tr></table></body></html>`
    });
};

export const sendOnboardingFormConfirmationEmail = async ({ to, firstName, productNames }) => {
    const settings = await getMailSettings();
    if (!settings.host || !settings.user || !settings.pass) return;
    const transporter = nodemailer.createTransport({ host: settings.host, port: settings.port, secure: settings.secure, auth: { user: settings.user, pass: settings.pass } });
    await transporter.sendMail({
        from: settings.from, to,
        subject: 'Onboarding Formunuz Alındı — Khilonfast',
        html: `<!doctype html><html lang="tr"><head><meta charset="utf-8"/></head><body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:24px 12px"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #d9e2ec"><tr><td style="background:linear-gradient(135deg,#0f766e,#0ea5a4);padding:20px 24px;color:#fff"><h1 style="margin:0;font-size:20px">Formunuz Alındı</h1></td></tr><tr><td style="padding:24px"><p style="margin:0 0 14px;font-size:15px">Merhaba ${firstName || 'Değerli Müşterimiz'},</p><p style="margin:0 0 14px;font-size:14px;color:#334e68">${productNames ? `<strong>${productNames}</strong> hizmeti için ` : ''}B2B Growth Onboarding formunuz alınmıştır. Ekibimiz en kısa sürede sizinle iletişime geçecektir.</p></td></tr></table></td></tr></table></body></html>`
    });
};

// ────────────────────────────────────────────────
// Sipariş Onayı (Müşteri) ve Admin Satış Bildirimi
// ────────────────────────────────────────────────

const formatMoney = (amount, currency = 'TRY') => {
    const n = Number(amount || 0);
    try {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(n);
    } catch {
        return `${n.toFixed(2)} ${currency}`;
    }
};

const buildOrderItemsRows = (items = []) => items.map(it => {
    const name = it.product_name || it.name || `#${it.product_id}`;
    const qty = it.quantity || 1;
    const unit = formatMoney(it.unit_price, it.currency);
    const total = formatMoney(it.total_price ?? Number(it.unit_price) * qty, it.currency);
    return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b">${name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#475569;text-align:center">${qty}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#475569;text-align:right">${unit}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b;text-align:right;font-weight:600">${total}</td>
    </tr>`;
}).join('');

const buildOrderConfirmationHtml = ({ firstName, order, items, dashboardUrl }) => {
    const currency = order.currency || 'TRY';
    const subtotal = Number(order.subtotal_amount ?? order.total_amount ?? 0);
    const discount = Number(order.coupon_discount_amount ?? 0);
    const total = Number(order.total_amount ?? 0);
    const isFree = total <= 0;

    return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Sipariş Onayı</title></head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#102a43">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="620" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #d9e2ec">
  <tr><td style="background:linear-gradient(135deg,#0f766e,#0ea5a4);padding:22px 24px;color:#fff">
    <h1 style="margin:0;font-size:22px;line-height:1.3">${isFree ? 'Siparişiniz Onaylandı 🎉' : 'Ödemeniz Alındı ✓'}</h1>
    <p style="margin:8px 0 0;font-size:13px;opacity:.95">Sipariş No: <strong>${order.order_number}</strong></p>
  </td></tr>
  <tr><td style="padding:24px">
    <p style="margin:0 0 14px;font-size:15px">Merhaba ${firstName || 'Değerli Müşterimiz'},</p>
    <p style="margin:0 0 18px;font-size:14px;color:#334e68">${isFree
        ? 'Kuponunuz başarıyla uygulandı ve siparişiniz onaylandı. Hizmetinize panelinizden hemen ulaşabilirsiniz.'
        : 'Ödemeniz başarıyla alındı, siparişiniz onaylandı. Satın aldığınız hizmet panelinize tanımlandı.'}</p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin:0 0 18px">
      <thead><tr style="background:#f1f5f9">
        <th align="left"  style="padding:10px 12px;font-size:12px;color:#475569;text-transform:uppercase">Ürün / Hizmet</th>
        <th align="center" style="padding:10px 12px;font-size:12px;color:#475569;text-transform:uppercase">Adet</th>
        <th align="right" style="padding:10px 12px;font-size:12px;color:#475569;text-transform:uppercase">Birim</th>
        <th align="right" style="padding:10px 12px;font-size:12px;color:#475569;text-transform:uppercase">Tutar</th>
      </tr></thead>
      <tbody>${buildOrderItemsRows(items)}</tbody>
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px">
      <tr><td style="padding:4px 0;font-size:13px;color:#475569">Ara toplam</td>
          <td align="right" style="padding:4px 0;font-size:13px;color:#1e293b">${formatMoney(subtotal, currency)}</td></tr>
      ${discount > 0 ? `<tr><td style="padding:4px 0;font-size:13px;color:#475569">Kupon indirimi${order.coupon_code ? ` (${order.coupon_code})` : ''}</td>
          <td align="right" style="padding:4px 0;font-size:13px;color:#dc2626">- ${formatMoney(discount, currency)}</td></tr>` : ''}
      <tr><td style="padding:10px 0 0;border-top:2px solid #0f766e;font-size:15px;color:#0f172a;font-weight:700">Genel toplam</td>
          <td align="right" style="padding:10px 0 0;border-top:2px solid #0f766e;font-size:15px;color:#0f766e;font-weight:700">${formatMoney(total, currency)}</td></tr>
    </table>

    <p style="margin:0 0 18px;font-size:13px;color:#334e68">Siparişinizin detaylarına ve hizmet erişimine panelinizden ulaşabilirsiniz.</p>
    <p style="margin:0 0 22px"><a href="${dashboardUrl}" style="display:inline-block;padding:12px 22px;background:#0f766e;color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px">Panele Git</a></p>
    <p style="margin:0;font-size:12px;color:#64748b">Bir sorun yaşarsanız bu e-postayı yanıtlayarak bize ulaşabilirsiniz.</p>
  </td></tr>
</table>
</td></tr></table></body></html>`;
};

const buildAdminSaleHtml = ({ order, items, customer }) => {
    const currency = order.currency || 'TRY';
    return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="620" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #d9e2ec">
  <tr><td style="background:linear-gradient(135deg,#1e3a8a,#0ea5a4);padding:20px 24px;color:#fff">
    <h1 style="margin:0;font-size:20px">💰 Yeni Satış</h1>
    <p style="margin:6px 0 0;font-size:13px;opacity:.9">Sipariş <strong>${order.order_number}</strong> · ${formatMoney(order.total_amount, currency)}</p>
  </td></tr>
  <tr><td style="padding:20px 24px">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px">
      <tr><td style="padding:4px 0;font-size:13px;color:#64748b;width:35%">Müşteri</td><td style="padding:4px 0;font-size:13px;color:#0f172a"><strong>${customer.name || '—'}</strong></td></tr>
      <tr><td style="padding:4px 0;font-size:13px;color:#64748b">E-posta</td><td style="padding:4px 0;font-size:13px;color:#0f172a">${customer.email}</td></tr>
      ${customer.phone ? `<tr><td style="padding:4px 0;font-size:13px;color:#64748b">Telefon</td><td style="padding:4px 0;font-size:13px;color:#0f172a">${customer.phone}</td></tr>` : ''}
      <tr><td style="padding:4px 0;font-size:13px;color:#64748b">Müşteri tipi</td><td style="padding:4px 0;font-size:13px;color:#0f172a">${customer.is_new ? '🆕 Yeni kayıt' : '🔁 Mevcut müşteri'}</td></tr>
      ${order.coupon_code ? `<tr><td style="padding:4px 0;font-size:13px;color:#64748b">Kupon</td><td style="padding:4px 0;font-size:13px;color:#0f172a"><code>${order.coupon_code}</code> (- ${formatMoney(order.coupon_discount_amount, currency)})</td></tr>` : ''}
      <tr><td style="padding:4px 0;font-size:13px;color:#64748b">Ödeme yöntemi</td><td style="padding:4px 0;font-size:13px;color:#0f172a">${order.payment_method || (Number(order.total_amount) <= 0 ? 'Ücretsiz (kupon)' : 'Kredi kartı')}</td></tr>
    </table>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
      <thead><tr style="background:#f1f5f9">
        <th align="left"  style="padding:10px 12px;font-size:12px;color:#475569">Ürün</th>
        <th align="center" style="padding:10px 12px;font-size:12px;color:#475569">Adet</th>
        <th align="right" style="padding:10px 12px;font-size:12px;color:#475569">Tutar</th>
      </tr></thead>
      <tbody>${items.map(it => `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b">${it.product_name || `#${it.product_id}`}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#475569;text-align:center">${it.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;text-align:right;font-weight:600">${formatMoney(it.total_price, currency)}</td>
      </tr>`).join('')}</tbody>
    </table>
  </td></tr>
</table>
</td></tr></table></body></html>`;
};

const getAdminRecipients = async () => {
    const [rows] = await db.query(
        `SELECT setting_key, setting_value FROM settings
         WHERE setting_key IN ('admin_notification_email','contact_email','sale_notification_emails')`
    );
    const map = rows.reduce((a, r) => { a[r.setting_key] = r.setting_value; return a; }, {});
    const raw = map.sale_notification_emails || map.admin_notification_email || map.contact_email
        || process.env.SALE_NOTIFICATION_EMAILS || process.env.ADMIN_EMAIL || '';
    return String(raw).split(/[,;]/).map(s => s.trim()).filter(Boolean);
};

export const sendOrderConfirmationEmail = async ({ to, firstName, order, items, dashboardUrl }) => {
    const settings = await getMailSettings();
    if (!settings.host || !settings.user || !settings.pass || !settings.from) {
        throw new Error('SMTP ayarlari eksik');
    }
    const transporter = nodemailer.createTransport({
        host: settings.host, port: settings.port, secure: settings.secure,
        auth: { user: settings.user, pass: settings.pass }
    });
    await transporter.sendMail({
        from: settings.from,
        to,
        subject: `Khilonfast - Siparişiniz Onaylandı (${order.order_number})`,
        html: buildOrderConfirmationHtml({ firstName, order, items, dashboardUrl: dashboardUrl || 'https://khilonfast.com/dashboard' })
    });
};

export const sendOrderAdminNotificationEmail = async ({ order, items, customer }) => {
    const settings = await getMailSettings();
    if (!settings.host || !settings.user || !settings.pass || !settings.from) return;
    const recipients = await getAdminRecipients();
    if (!recipients.length) return;
    const transporter = nodemailer.createTransport({
        host: settings.host, port: settings.port, secure: settings.secure,
        auth: { user: settings.user, pass: settings.pass }
    });
    await transporter.sendMail({
        from: settings.from,
        to: recipients.join(','),
        subject: `[Khilonfast] Yeni satış — ${order.order_number} · ${formatMoney(order.total_amount, order.currency)}`,
        html: buildAdminSaleHtml({ order, items, customer })
    });
};

export default {
    sendWelcomeAccountEmail,
    sendOnboardingFormAdminEmail,
    sendOnboardingFormConfirmationEmail,
    sendOrderConfirmationEmail,
    sendOrderAdminNotificationEmail
};

