import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payment.js';
import profileRoutes from './routes/profile.js';
import companyRoutes from './routes/company.js';
import adminRoutes from './routes/admin.js';
import pagesRoutes from './routes/pages.js';
import consultantsRoutes from './routes/consultants.js';
import trainingAnalyticsRoutes from './routes/training-analytics.js';
import onboardingRoutes from './routes/onboarding.js';
import couponRoutes from './routes/coupons.js';
import emailAutomationRoutes from './routes/email-automation.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pages', pagesRoutes);
app.use('/api/consultants', consultantsRoutes);
app.use('/api/training-analytics', trainingAnalyticsRoutes);
app.use('/api/onboarding-form', onboardingRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/email-automation', emailAutomationRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'khilonfast API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📡 API endpoint: http://localhost:${PORT}`);
});

export default app;
