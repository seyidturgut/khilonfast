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

    resolveConfig(runtimeConfig = {}) {
        const resolvedTestMode = typeof runtimeConfig.testMode === 'boolean' ? runtimeConfig.testMode : this.testMode;
        const configuredApiUrl = runtimeConfig.apiUrl || this.apiUrl;

        return {
            apiUrl: this.resolveApiUrl(configuredApiUrl, resolvedTestMode),
            apiKey: runtimeConfig.apiKey || this.apiKey,
            secretKey: runtimeConfig.secretKey || this.secretKey,
            merchantId: runtimeConfig.merchantId || this.merchantId,
            testMode: resolvedTestMode,
            useHosted: typeof runtimeConfig.useHosted === 'boolean' ? runtimeConfig.useHosted : false,
            merchantCode: runtimeConfig.merchantCode || '',
            merchantKey: runtimeConfig.merchantKey || runtimeConfig.apiKey || this.apiKey,
            apiPassword: runtimeConfig.apiPassword || runtimeConfig.secretKey || this.secretKey,
            authorization: runtimeConfig.authorization || '',
            processPaymentPath: this.resolveEndpointPath('processPayment', runtimeConfig.processPaymentPath || '/payment/process'),
            process3dsPath: this.resolveEndpointPath('process3ds', runtimeConfig.process3dsPath || '/payment/process3ds'),
            startHostedPaymentPath: this.resolveEndpointPath('startHostedPayment', runtimeConfig.startHostedPaymentPath || '/StartHostedPaymentProcess'),
            queryPaymentPath: runtimeConfig.queryPaymentPath || '/payment/query/{transactionId}',
            refundPaymentPath: runtimeConfig.refundPaymentPath || '/payment/refund'
        };
    }

    resolveApiUrl(apiUrl, testMode) {
        const normalized = String(apiUrl || '').replace(/\/+$/, '');
        if (!normalized) {
            return testMode ? 'https://test.lidio.com/api' : 'https://api.lidio.com';
        }
        if (testMode && normalized === 'https://api.lidio.com') {
            return 'https://test.lidio.com/api';
        }
        return normalized;
    }

    resolveEndpointPath(kind, path) {
        const normalized = this.normalizePath(path || '');
        const lower = normalized.toLowerCase();

        if (kind === 'processPayment') {
            if (lower === '/payment/process' || lower === '/payment/processpayment') {
                return '/ProcessPayment';
            }
        }

        if (kind === 'process3ds') {
            if (
                lower === '/payment/process3ds' ||
                lower === '/payment/process3dspayment' ||
                lower === '/payment/process3d'
            ) {
                // Lidio uses ProcessPayment for the first 3DS step.
                return '/ProcessPayment';
            }
        }

        if (kind === 'startHostedPayment') {
            if (
                lower === '/starthostedpaymentprocess' ||
                lower === '/payment/starthostedpaymentprocess' ||
                lower === '/payment/start-hosted-payment-process'
            ) {
                return '/StartHostedPaymentProcess';
            }
        }

        return normalized;
    }

    normalizePath(path) {
        if (!path) return '';
        return path.startsWith('/') ? path : `/${path}`;
    }

    buildAuthorizationHeader(cfg) {
        const rawAuthorization = String(cfg.authorization || '').trim();
        const hasKnownScheme = /^(MxS2S|Bearer|Basic)\s+/i.test(rawAuthorization);
        if (hasKnownScheme) return rawAuthorization;

        // If a raw token is stored without scheme in CMS, prefer deterministic key/password auth.
        if (cfg.merchantKey && cfg.apiPassword) {
            const token = Buffer.from(`${cfg.merchantKey}:${cfg.apiPassword}`).toString('base64');
            return `MxS2S ${token}`;
        }
        if (rawAuthorization) return `Bearer ${rawAuthorization}`;
        if (cfg.apiKey) return `Bearer ${cfg.apiKey}`;
        return '';
    }

    buildHeaders(cfg, authHash = null) {
        const headers = { 'Content-Type': 'application/json' };
        const auth = this.buildAuthorizationHeader(cfg);
        if (auth) headers.Authorization = auth;
        if (cfg.merchantCode) headers.MerchantCode = cfg.merchantCode;
        if (authHash) headers['X-Auth-Hash'] = authHash;
        return headers;
    }

    pickFirstDefined(values) {
        for (const value of values) {
            if (value !== undefined && value !== null && String(value).trim() !== '') {
                return value;
            }
        }
        return undefined;
    }

    normalizePaymentResponse(raw) {
        const payload = raw || {};
        const root = payload?.data || payload?.Data || payload?.result || payload?.Result || payload;

        const redirectUrl = this.pickFirstDefined([
            payload.redirectUrl,
            payload.redirectURL,
            payload.redirect_url,
            payload.threeDSUrl,
            payload.three_ds_url,
            payload.paymentPageUrl,
            payload.payment_page_url,
            payload.url,
            payload.redirect,
            payload.RedirectUrl,
            payload.RedirectURL,
            payload.PaymentPageUrl,
            payload.ThreeDSUrl,
            root?.redirectUrl,
            root?.redirectURL,
            root?.redirect_url,
            root?.threeDSUrl,
            root?.three_ds_url,
            root?.paymentPageUrl,
            root?.payment_page_url,
            root?.url,
            root?.redirect,
            root?.RedirectUrl,
            root?.RedirectURL,
            root?.PaymentPageUrl,
            root?.ThreeDSUrl
        ]);

        const rawStatus = this.pickFirstDefined([
            payload.status,
            payload.Status,
            payload.paymentStatus,
            payload.PaymentStatus,
            root?.status,
            root?.Status,
            root?.paymentStatus,
            root?.PaymentStatus
        ]);
        const status = String(rawStatus || '').toLowerCase();

        const explicitSuccess = this.pickFirstDefined([
            payload.success,
            payload.Success,
            payload.isSuccessful,
            payload.IsSuccessful,
            root?.success,
            root?.Success,
            root?.isSuccessful,
            root?.IsSuccessful
        ]);

        const success = typeof explicitSuccess === 'boolean'
            ? explicitSuccess
            : ['success', 'approved', 'ok', 'completed'].includes(status) ||
              String(payload?.result || root?.result || '').toLowerCase() === 'success';

        const requires3DS = Boolean(
            redirectUrl ||
            payload.redirectForm ||
            payload.redirectFormParams ||
            payload.requires3DS ||
            payload.requires_3ds ||
            payload.ThreeDSRequired ||
            root?.redirectForm ||
            root?.redirectFormParams ||
            root?.requires3DS ||
            root?.requires_3ds ||
            root?.ThreeDSRequired
        );

        const transactionId = this.pickFirstDefined([
            payload.transactionId,
            payload.transaction_id,
            payload.TransactionId,
            payload.merchantPaymentId,
            payload.MerchantPaymentId,
            root?.transactionId,
            root?.transaction_id,
            root?.TransactionId,
            root?.merchantPaymentId,
            root?.MerchantPaymentId
        ]);

        return {
            ...payload,
            success,
            status: rawStatus || (success ? 'success' : 'pending'),
            requires3DS,
            redirectUrl,
            redirectForm: payload.redirectForm || root?.redirectForm || null,
            redirectFormParams: payload.redirectFormParams || root?.redirectFormParams || null,
            transactionId,
            raw: payload
        };
    }

    buildCardPaymentRequest(paymentData, use3DSecure) {
        const month = Number(String(paymentData.cardExpireMonth || '').replace(/\D/g, ''));
        const year = Number(String(paymentData.cardExpireYear || '').replace(/\D/g, ''));
        const installmentCount = Number(paymentData.installment || 0);

        const cardInfo = {
            cardHolderName: paymentData.cardHolderName || '',
            cardNumber: String(paymentData.cardNumber || '').replace(/\s+/g, ''),
            lastMonth: month,
            lastYear: year
        };

        const customerInfo = {
            customerId: String(paymentData.customerInfo?.customerId || ''),
            name: [paymentData.customerInfo?.customerName, paymentData.customerInfo?.customerSurname]
                .filter(Boolean)
                .join(' ')
                .trim() || paymentData.customerInfo?.customerName || '',
            email: paymentData.customerInfo?.customerEmail || '',
            phone: paymentData.customerInfo?.customerPhoneNumber || ''
        };

        return {
            orderId: String(paymentData.orderId || ''),
            merchantProcessId: String(paymentData.merchantProcessId || paymentData.orderId || ''),
            totalAmount: Number(paymentData.amount || 0),
            currency: paymentData.currency || 'TRY',
            customerInfo,
            paymentInstrument: 'NewCard',
            paymentInstrumentInfo: {
                newCard: {
                    processType: 'sales',
                    cardInfo,
                    cvv: String(paymentData.cardCvv || ''),
                    use3DSecure: Boolean(use3DSecure),
                    installmentCount,
                    loyaltyPointUsage: 'None',
                    // Docs export marks these as required for newCard.
                    merchantDataShareApproved: true,
                    termsConditionsApproved: true
                }
            },
            returnUrl: paymentData.returnUrl || paymentData.callbackUrl || undefined,
            notificationUrl: paymentData.notificationUrl || undefined,
            clientIp: paymentData.customerInfo?.customerIpAddress || undefined
        };
    }

    async startHostedPaymentProcess(paymentData, runtimeConfig = {}) {
        try {
            const cfg = this.resolveConfig(runtimeConfig);

            if (
                (!cfg.authorization && !cfg.merchantKey && !cfg.apiKey) ||
                cfg.merchantKey === 'your-lidio-api-key' ||
                cfg.apiKey === 'your-lidio-api-key'
            ) {
                return {
                    success: true,
                    requires3DS: true,
                    status: 'success',
                    redirectUrl: `https://test.lidio.com/hosted/mock/${Date.now()}`,
                    message: 'Test hosted payment started (Lidio credentials not configured)',
                    testMode: true
                };
            }

            const customerInfoPayload = {
                customerId: String(paymentData.customerInfo?.customerId || ''),
                name: paymentData.customerInfo?.customerName || '',
                surname: paymentData.customerInfo?.customerSurname || '',
                email: paymentData.customerInfo?.customerEmail || '',
                phoneNumber: paymentData.customerInfo?.customerPhoneNumber || '',
                ipAddress: paymentData.customerInfo?.customerIpAddress || '',
                CustomerId: String(paymentData.customerInfo?.customerId || ''),
                Name: paymentData.customerInfo?.customerName || '',
                Surname: paymentData.customerInfo?.customerSurname || '',
                Email: paymentData.customerInfo?.customerEmail || '',
                PhoneNumber: paymentData.customerInfo?.customerPhoneNumber || '',
                IpAddress: paymentData.customerInfo?.customerIpAddress || ''
            };

            const normalizeHostedOrderId = (value) => {
                const raw = String(value || '')
                    .replace(/[^a-zA-Z0-9_]/g, '')
                    .slice(0, 20);
                return raw || `ORD${Date.now()}`.slice(0, 20);
            };

            const hostedOrderId = normalizeHostedOrderId(paymentData.hostedOrderId || paymentData.orderId);

            const requestData = {
                orderId: hostedOrderId,
                merchantProcessId: String(paymentData.merchantProcessId || paymentData.orderId),
                totalAmount: Number(paymentData.amount),
                currency: paymentData.currency || 'TRY',
                customerInfo: customerInfoPayload,
                paymentInstruments: ['NewCard'],
                paymentInstrumentInfo: {
                    newCard: {},
                    NewCard: {}
                },
                returnUrl: paymentData.returnUrl || paymentData.callbackUrl || undefined,
                notificationUrl: paymentData.notificationUrl || undefined
            };

            console.info('[lidio:request] startHostedPaymentProcess payload summary', {
                orderId: requestData.orderId,
                totalAmount: requestData.totalAmount,
                currency: requestData.currency,
                hasCustomerInfo: Boolean(requestData.customerInfo?.customerId || requestData.customerInfo?.email),
                paymentInstruments: requestData.paymentInstruments
            });

            const response = await this.postWithFallback(
                cfg,
                cfg.startHostedPaymentPath,
                ['/StartHostedPaymentProcess'],
                requestData,
                null
            );

            return this.normalizePaymentResponse(response.data);
        } catch (error) {
            console.error('Lidio hosted payment error:', error.message, error?.response?.data || '');
            throw new Error('Hosted payment start failed: ' + error.message);
        }
    }

    /**
     * Generate authentication hash for Lidio API
     */
    generateAuthHash(data, secretKey = this.secretKey) {
        const dataString = JSON.stringify(data);
        return crypto
            .createHmac('sha256', secretKey)
            .update(dataString)
            .digest('hex');
    }

    /**
     * Process payment - Single step (non-3D)
     * @param {Object} paymentData - Payment information
     * @returns {Promise} Payment result
     */
    async processPayment(paymentData, runtimeConfig = {}) {
        try {
            const cfg = this.resolveConfig(runtimeConfig);
            // Note: This is a placeholder implementation
            // Actual Lidio API integration will be added when credentials are provided

            if (
                (!cfg.authorization && !cfg.merchantKey && !cfg.apiKey) ||
                cfg.merchantKey === 'your-lidio-api-key' ||
                cfg.apiKey === 'your-lidio-api-key'
            ) {
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

            const requestData = this.buildCardPaymentRequest(paymentData, false);

            const authHash = this.generateAuthHash(requestData, cfg.secretKey);
            console.info('[lidio:request] processPayment payload summary', {
                hasCardInfo: Boolean(requestData.paymentInstrumentInfo?.newCard?.cardInfo),
                hasCustomerInfo: Boolean(requestData.customerInfo),
                paymentInstrument: requestData.paymentInstrument,
                orderId: requestData.orderId,
                totalAmount: requestData.totalAmount,
                authScheme: String(this.buildAuthorizationHeader(cfg)).split(' ')[0] || 'none'
            });

            const response = await this.postWithFallback(
                cfg,
                cfg.processPaymentPath,
                ['/ProcessPayment'],
                requestData,
                authHash
            );

            return this.normalizePaymentResponse(response.data);
        } catch (error) {
            console.error('Lidio payment error:', error.message, error?.response?.data || '');
            throw new Error('Payment processing failed: ' + error.message);
        }
    }

    /**
     * Process 3DS payment
     * @param {Object} paymentData - Payment information
     * @returns {Promise} 3DS redirect URL or payment result
     */
    async process3DSPayment(paymentData, runtimeConfig = {}) {
        try {
            const cfg = this.resolveConfig(runtimeConfig);

            if (
                (!cfg.authorization && !cfg.merchantKey && !cfg.apiKey) ||
                cfg.merchantKey === 'your-lidio-api-key' ||
                cfg.apiKey === 'your-lidio-api-key'
            ) {
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

            const requestData = this.buildCardPaymentRequest(paymentData, true);

            const authHash = this.generateAuthHash(requestData, cfg.secretKey);
            console.info('[lidio:request] process3DSPayment payload summary', {
                hasCardInfo: Boolean(requestData.paymentInstrumentInfo?.newCard?.cardInfo),
                hasCustomerInfo: Boolean(requestData.customerInfo),
                paymentInstrument: requestData.paymentInstrument,
                orderId: requestData.orderId,
                totalAmount: requestData.totalAmount,
                authScheme: String(this.buildAuthorizationHeader(cfg)).split(' ')[0] || 'none'
            });

            const response = await this.postWithFallback(
                cfg,
                cfg.process3dsPath,
                ['/ProcessPayment', '/FinishPaymentProcess'],
                requestData,
                authHash
            );

            return this.normalizePaymentResponse(response.data);
        } catch (error) {
            console.error('Lidio 3DS payment error:', error.message, error?.response?.data || '');
            throw new Error('3DS payment processing failed: ' + error.message);
        }
    }

    /**
     * Query payment status
     * @param {string} transactionId - Lidio transaction ID
     * @returns {Promise} Payment status
     */
    async queryPayment(transactionId, runtimeConfig = {}) {
        try {
            const cfg = this.resolveConfig(runtimeConfig);

            if (
                (!cfg.authorization && !cfg.merchantKey && !cfg.apiKey) ||
                cfg.merchantKey === 'your-lidio-api-key' ||
                cfg.apiKey === 'your-lidio-api-key'
            ) {
                return {
                    success: true,
                    transactionId,
                    status: 'completed',
                    testMode: true
                };
            }

            const queryPath = this
                .normalizePath(cfg.queryPaymentPath)
                .replace('{transactionId}', encodeURIComponent(transactionId));

            const response = await axios.get(
                `${cfg.apiUrl}${queryPath}`,
                {
                    headers: this.buildHeaders(cfg)
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
    async refundPayment(transactionId, amount, runtimeConfig = {}) {
        try {
            const cfg = this.resolveConfig(runtimeConfig);

            if (
                (!cfg.authorization && !cfg.merchantKey && !cfg.apiKey) ||
                cfg.merchantKey === 'your-lidio-api-key' ||
                cfg.apiKey === 'your-lidio-api-key'
            ) {
                return {
                    success: true,
                    refundId: `REFUND-${Date.now()}`,
                    status: 'refunded',
                    testMode: true
                };
            }

            const requestData = {
                merchantId: cfg.merchantId || cfg.merchantCode,
                transactionId,
                amount
            };

            const authHash = this.generateAuthHash(requestData, cfg.secretKey);

            const response = await axios.post(
                `${cfg.apiUrl}${this.normalizePath(cfg.refundPaymentPath)}`,
                requestData,
                {
                    headers: this.buildHeaders(cfg, authHash)
                }
            );

            return response.data;
        } catch (error) {
            console.error('Lidio refund error:', error.message);
            throw new Error('Refund failed: ' + error.message);
        }
    }

    async postWithFallback(cfg, primaryPath, fallbackPaths, requestData, authHash) {
        const candidates = [
            this.normalizePath(primaryPath),
            ...fallbackPaths.map((path) => this.normalizePath(path))
        ].filter(Boolean);

        const uniqueCandidates = [...new Set(candidates)];
        let lastError = null;

        for (const path of uniqueCandidates) {
            try {
                return await axios.post(
                    `${cfg.apiUrl}${path}`,
                    requestData,
                    {
                        headers: this.buildHeaders(cfg, authHash)
                    }
                );
            } catch (error) {
                lastError = error;
                if (error?.response?.status !== 404) {
                    throw error;
                }
            }
        }

        throw lastError || new Error('Lidio request failed');
    }
}

export default new LidioService();
