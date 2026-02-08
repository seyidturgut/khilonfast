import axios from 'axios';
import crypto from 'crypto';
import lidioConfig from '../config/lidio.js';

class LidioService {
    constructor() {
        this.apiUrl = lidioConfig.apiUrl;
        this.apiKey = lidioConfig.apiKey;
        this.secretKey = lidioConfig.secretKey;
        this.merchantId = lidioConfig.merchantId;
        this.testMode = lidioConfig.testMode;
    }

    /**
     * Generate authentication hash for Lidio API
     */
    generateAuthHash(data) {
        const dataString = JSON.stringify(data);
        return crypto
            .createHmac('sha256', this.secretKey)
            .update(dataString)
            .digest('hex');
    }

    /**
     * Process payment - Single step (non-3D)
     * @param {Object} paymentData - Payment information
     * @returns {Promise} Payment result
     */
    async processPayment(paymentData) {
        try {
            // Note: This is a placeholder implementation
            // Actual Lidio API integration will be added when credentials are provided

            if (!this.apiKey || this.apiKey === 'your-lidio-api-key') {
                // Simulate payment for development
                return {
                    success: true,
                    transactionId: `TEST-${Date.now()}`,
                    status: 'success',
                    message: 'Test payment successful (Lidio credentials not configured)',
                    amount: paymentData.amount,
                    testMode: true
                };
            }

            const requestData = {
                merchantId: this.merchantId,
                orderId: paymentData.orderId,
                amount: paymentData.amount,
                currency: paymentData.currency || 'TRY',
                cardNumber: paymentData.cardNumber,
                cardHolderName: paymentData.cardHolderName,
                cardExpireMonth: paymentData.cardExpireMonth,
                cardExpireYear: paymentData.cardExpireYear,
                cardCvv: paymentData.cardCvv,
                installment: paymentData.installment || 1
            };

            const authHash = this.generateAuthHash(requestData);

            const response = await axios.post(
                `${this.apiUrl}/payment/process`,
                requestData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`,
                        'X-Auth-Hash': authHash
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Lidio payment error:', error.message);
            throw new Error('Payment processing failed: ' + error.message);
        }
    }

    /**
     * Process 3DS payment
     * @param {Object} paymentData - Payment information
     * @returns {Promise} 3DS redirect URL or payment result
     */
    async process3DSPayment(paymentData) {
        try {
            if (!this.apiKey || this.apiKey === 'your-lidio-api-key') {
                // Simulate 3DS payment for development
                return {
                    success: true,
                    requires3DS: false,
                    transactionId: `TEST-3DS-${Date.now()}`,
                    status: 'success',
                    message: 'Test 3DS payment successful (Lidio credentials not configured)',
                    testMode: true
                };
            }

            const requestData = {
                merchantId: this.merchantId,
                orderId: paymentData.orderId,
                amount: paymentData.amount,
                currency: paymentData.currency || 'TRY',
                cardNumber: paymentData.cardNumber,
                cardHolderName: paymentData.cardHolderName,
                cardExpireMonth: paymentData.cardExpireMonth,
                cardExpireYear: paymentData.cardExpireYear,
                cardCvv: paymentData.cardCvv,
                callbackUrl: paymentData.callbackUrl,
                installment: paymentData.installment || 1
            };

            const authHash = this.generateAuthHash(requestData);

            const response = await axios.post(
                `${this.apiUrl}/payment/process3ds`,
                requestData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`,
                        'X-Auth-Hash': authHash
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Lidio 3DS payment error:', error.message);
            throw new Error('3DS payment processing failed: ' + error.message);
        }
    }

    /**
     * Query payment status
     * @param {string} transactionId - Lidio transaction ID
     * @returns {Promise} Payment status
     */
    async queryPayment(transactionId) {
        try {
            if (!this.apiKey || this.apiKey === 'your-lidio-api-key') {
                return {
                    success: true,
                    transactionId,
                    status: 'completed',
                    testMode: true
                };
            }

            const response = await axios.get(
                `${this.apiUrl}/payment/query/${transactionId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Lidio query error:', error.message);
            throw new Error('Payment query failed: ' + error.message);
        }
    }

    /**
     * Refund payment
     * @param {string} transactionId - Original transaction ID
     * @param {number} amount - Refund amount
     * @returns {Promise} Refund result
     */
    async refundPayment(transactionId, amount) {
        try {
            if (!this.apiKey || this.apiKey === 'your-lidio-api-key') {
                return {
                    success: true,
                    refundId: `REFUND-${Date.now()}`,
                    status: 'refunded',
                    testMode: true
                };
            }

            const requestData = {
                merchantId: this.merchantId,
                transactionId,
                amount
            };

            const authHash = this.generateAuthHash(requestData);

            const response = await axios.post(
                `${this.apiUrl}/payment/refund`,
                requestData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`,
                        'X-Auth-Hash': authHash
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Lidio refund error:', error.message);
            throw new Error('Refund failed: ' + error.message);
        }
    }
}

export default new LidioService();
