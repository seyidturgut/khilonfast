import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { body, validationResult } from 'express-validator';
import db from '../config/database.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// SMTP ayarlarını settings tablosundan oku
const getMailSettings = async () => {
    const [rows] = await db.query(
        `SELECT setting_key, setting_value FROM settings
         WHERE setting_key IN ('smtp_host','smtp_port','smtp_user','smtp_pass','smtp_secure','contact_email')`
    );
    const map = rows.reduce((a, r) => { a[r.setting_key] = r.setting_value; return a; }, {});
    const port = Number(map.smtp_port || process.env.SMTP_PORT || 465);
    return {
        host: map.smtp_host || process.env.SMTP_HOST,
        port,
        user: map.smtp_user || process.env.SMTP_USER,
        pass: map.smtp_pass || process.env.SMTP_PASS,
        secure: map.smtp_secure ? ['1','true','yes','on'].includes(String(map.smtp_secure).toLowerCase()) : port === 465,
        from: map.contact_email || process.env.SMTP_FROM || map.smtp_user || process.env.SMTP_USER
    };
};

// Register new user
router.post('/register',
    [
        body('email').isEmail().withMessage('Valid email required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('first_name').notEmpty().withMessage('First name required'),
        body('last_name').notEmpty().withMessage('Last name required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password, first_name, last_name, phone } = req.body;

            // Check if user already exists
            const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
            if (existingUsers.length > 0) {
                return res.status(400).json({ error: 'Email already registered' });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            // Insert user
            const [result] = await db.query(
                'INSERT INTO users (email, password_hash, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?)',
                [email, password_hash, first_name, last_name, phone || null]
            );

            // Generate JWT
            const token = jwt.sign(
                { id: result.insertId, email, role: 'user' },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.status(201).json({
                message: 'User registered successfully',
                token,
                user: {
                    id: result.insertId,
                    email,
                    first_name,
                    last_name,
                    role: 'user',
                    must_change_password: false
                }
            });
        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

// Login
router.post('/login',
    [
        body('email').isEmail().withMessage('Valid email required'),
        body('password').notEmpty().withMessage('Password required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password } = req.body;

            // Get user
            const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
            if (users.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const user = users[0];

            // Check password
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Generate JWT
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role || 'user' },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role || 'user',
                    must_change_password: Boolean(user.must_change_password)
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

// POST /api/auth/forgot-password — şifre sıfırlama linki gönderir.
// Email enumeration'ı önlemek için her durumda success döner.
router.post('/forgot-password',
    [body('email').isEmail().withMessage('Valid email required')],
    async (req, res) => {
        const errors = validationResult(req);
        const isEn = String(req.body.lang || 'tr').toLowerCase() === 'en';
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: isEn ? 'Invalid email address' : 'Geçersiz e-posta adresi' });
        }
        const email = String(req.body.email).trim().toLowerCase();

        try {
            const [users] = await db.query(
                'SELECT id, email, first_name FROM users WHERE LOWER(email) = ? LIMIT 1',
                [email]
            );

            if (users.length > 0) {
                const u = users[0];
                const resetToken = jwt.sign(
                    { id: u.id, email: u.email, purpose: 'password_reset' },
                    process.env.JWT_SECRET,
                    { expiresIn: '1h' }
                );

                const settings = await getMailSettings();
                if (settings.host && settings.user && settings.pass && settings.from) {
                    const resetUrl = `https://khilonfast.com${isEn ? '/en/set-password' : '/sifre-belirle'}?token=${encodeURIComponent(resetToken)}&mode=reset`;
                    const safeFirst = String(u.first_name || (isEn ? 'User' : 'Değerli Kullanıcı')).replace(/[<>]/g, '');

                    const subject = isEn ? 'Khilonfast — Reset Your Password' : 'Khilonfast — Şifre Sıfırlama Talebi';
                    const heading = isEn ? 'Reset Your Password' : 'Şifrenizi Sıfırlayın';
                    const intro = isEn ? `Hi <strong>${safeFirst}</strong>,` : `Merhaba <strong>${safeFirst}</strong>,`;
                    const body = isEn
                        ? 'We received a request to reset the password on your Khilonfast account. Click the button below to set a new password. This link is valid for 1 hour.'
                        : 'Khilonfast hesabınız için şifre sıfırlama talebi aldık. Yeni şifrenizi belirlemek için aşağıdaki butona tıklayın. Bu link 1 saat geçerlidir.';
                    const btn = isEn ? 'Reset Password' : 'Şifremi Sıfırla';
                    const foot = isEn
                        ? "If you didn't request a password reset, you can safely ignore this email."
                        : 'Eğer böyle bir talepte bulunmadıysanız bu e-postayı görmezden gelebilirsiniz; hesabınız güvende.';

                    const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f6f8fb;padding:20px;margin:0;">
                        <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #dde7f0;border-radius:12px;overflow:hidden;">
                        <div style="background:linear-gradient(90deg,#1a3a52,#89b004);color:#fff;padding:20px 24px;">
                            <h2 style="margin:0;font-size:1.3rem;">${heading}</h2>
                        </div>
                        <div style="padding:24px;color:#102a43;line-height:1.7;">
                            <p style="margin-top:0;">${intro}</p>
                            <p>${body}</p>
                            <div style="text-align:center;margin:28px 0;">
                                <a href="${resetUrl}"
                                   style="background-color:#1a3a52;color:#ffffff !important;text-decoration:none;
                                          padding:14px 32px;border-radius:8px;font-weight:700;font-size:1rem;display:inline-block;">
                                    ${btn} →
                                </a>
                            </div>
                            <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;"/>
                            <p style="font-size:0.82rem;color:#94a3b8;margin:0;">${foot}</p>
                        </div></div></body></html>`;

                    const transporter = nodemailer.createTransport({
                        host: settings.host, port: settings.port, secure: settings.secure,
                        auth: { user: settings.user, pass: settings.pass }
                    });
                    await transporter.sendMail({
                        from: settings.from,
                        to: email,
                        subject,
                        html
                    });
                } else {
                    console.warn('[forgot-password] SMTP ayarları eksik, mail gönderilemedi:', email);
                }
            }
        } catch (err) {
            console.error('[forgot-password] error:', err);
            // sessizce yutuyoruz — enumeration'ı önle
        }

        res.json({
            message: isEn
                ? 'If an account exists for this email, a reset link has been sent.'
                : 'Bu e-postaya kayıtlı bir hesap varsa, sıfırlama bağlantısı gönderildi.'
        });
    }
);

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, email, first_name, last_name, phone, role, must_change_password, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: users[0] });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
