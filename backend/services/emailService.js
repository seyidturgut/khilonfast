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

export default {
    sendWelcomeAccountEmail
};

