// backend/services/consultantMailer.js
// Danışmanlık randevu e-postaları (Node tarafı — dual backend).
// Şablonlar automation_email_templates id 70-73 (2026_05_21_consultant_emails.sql).
import crypto from 'crypto';
import db from '../config/database.js';
import { sendCustomMail } from './emailService.js';

// Booking için tahmin edilemez token (reschedule/cancel linkleri)
export function consultantBookingToken(bookingId) {
    const secret = process.env.JWT_SECRET || 'khilonfast-consultant';
    return crypto.createHmac('sha256', secret)
        .update('consultant-booking-' + bookingId).digest('hex').slice(0, 32);
}

export const CONSULTANT_TPL = {
    CONFIRM: 70,    // Randevu Onaylandı
    REMINDER: 71,   // Görüşmeye 1 Gün Kala
    RESCHEDULE: 72, // Takvim Değişikliği
    PAYMENT: 73,    // Ödeme Son Adım
};

const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://khilonfast.com').replace(/\/+$/, '');

// {{key}} placeholder render
function render(tpl, vars) {
    return String(tpl || '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k) => String(vars[k] ?? ''));
}

// Booking satırından ortak şablon değişkenleri
export async function consultantBuildVars(booking) {
    let packageName = '';
    if (booking.service_id) {
        const [s] = await db.query('SELECT title FROM consultant_services WHERE id = ?', [booking.service_id]);
        packageName = s[0]?.title || '';
    }
    let appointment = '';
    if (booking.availability_id) {
        const [a] = await db.query(
            'SELECT available_date, start_time, end_time FROM consultant_availability WHERE id = ?',
            [booking.availability_id]
        );
        if (a[0]) {
            const d = new Date(a[0].available_date);
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            appointment = `${dd}.${mm}.${d.getFullYear()} ${String(a[0].start_time).slice(0, 5)}`;
            if (a[0].end_time) appointment += ` - ${String(a[0].end_time).slice(0, 5)}`;
        }
    }
    const bid = booking.id || 0;
    return {
        name: booking.name || '',
        package_name: packageName,
        appointment_datetime: appointment,
        meeting_link: booking.meeting_link || '',
        reschedule_link: `${FRONTEND_URL}/danismanlik/randevu/${bid}?t=${consultantBookingToken(bid)}`,
        payment_link: `${FRONTEND_URL}/danismanlik-odeme/${bid}`,
    };
}

// Şablonu yükle, render et, gönder. Hata fırlatmaz (log'a yazar).
export async function consultantSendMail(templateId, to, vars) {
    if (!to) return false;
    try {
        const [t] = await db.query(
            'SELECT subject, body_html FROM automation_email_templates WHERE id = ?',
            [templateId]
        );
        if (!t.length) {
            console.error('[consultant mail] template not found:', templateId);
            return false;
        }
        await sendCustomMail({
            to,
            subject: render(t[0].subject, vars),
            html: render(t[0].body_html, vars),
        });
        return true;
    } catch (e) {
        console.error('[consultant mail] tpl', templateId, 'err:', e.message);
        return false;
    }
}
