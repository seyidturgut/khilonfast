import dotenv from 'dotenv';

dotenv.config();

export const lidioConfig = {
    apiKey: process.env.LIDIO_API_KEY || '',
    secretKey: process.env.LIDIO_SECRET_KEY || '',
    merchantId: process.env.LIDIO_MERCHANT_ID || '',
    apiUrl: process.env.LIDIO_API_URL || 'https://api.lidio.com',
    testMode: process.env.LIDIO_TEST_MODE === 'true'
};

export default lidioConfig;
