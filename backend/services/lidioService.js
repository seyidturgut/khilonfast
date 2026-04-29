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
            refundPaymentPath: runtimeConfig.refundPaymentPath || '/payment/refund',
            finishPaymentPath: runtimeConfig.finishPaymentPath || '/FinishPaymentProcess',
            saveCardPath: runtimeConfig.saveCardPath || '/SaveCard'
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

        // Lidio "saveAfterSuccess" / SaveCard cevaplarında token tüm seviyelerde gelebilir.
        const cardToken = this.pickFirstDefined([
            payload.cardToken, payload.CardToken, payload.savedCardToken,
            payload.savedCard?.cardToken, payload.savedCard?.CardToken,
            payload.paymentInstrumentInfo?.newCard?.cardToken,
            payload.paymentInstrumentInfo?.savedCard?.cardToken,
            root?.cardToken, root?.CardToken, root?.savedCardToken,
            root?.savedCard?.cardToken,
            root?.paymentInstrumentInfo?.newCard?.cardToken
        ]);

        const maskedCardNumber = this.pickFirstDefined([
            payload.maskedCardNumber, payload.MaskedCardNumber,
            payload.savedCard?.maskedCardNumber, payload.cardInfo?.maskedCardNumber,
            root?.maskedCardNumber, root?.savedCard?.maskedCardNumber,
            root?.cardInfo?.maskedCardNumber
        ]);
        const cardBrand = this.pickFirstDefined([
            payload.cardBrand, payload.CardBrand, payload.cardAssociation, payload.CardAssociation,
            payload.savedCard?.cardBrand, payload.cardInfo?.cardBrand,
            root?.cardBrand, root?.savedCard?.cardBrand, root?.cardInfo?.cardBrand
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
            cardToken: cardToken || null,
            maskedCardNumber: maskedCardNumber || null,
            cardBrand: cardBrand || null,
            raw: payload
        };
    }

    buildCustomerInfo(paymentData) {
        return {
            customerId: String(paymentData.customerInfo?.customerId || ''),
            name: [paymentData.customerInfo?.customerName, paymentData.customerInfo?.customerSurname]
                .filter(Boolean)
                .join(' ')
                .trim() || paymentData.customerInfo?.customerName || '',
            email: paymentData.customerInfo?.customerEmail || '',
            phone: paymentData.customerInfo?.customerPhoneNumber || ''
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

        const newCard = {
            processType: 'sales',
            cardInfo,
            cvv: String(paymentData.cardCvv || ''),
            use3DSecure: Boolean(use3DSecure),
            installmentCount,
            loyaltyPointUsage: 'None',
            merchantDataShareApproved: true,
            termsConditionsApproved: true
        };

        // "Kartımı sakla" işaretliyse: başarılı 3DS sonrası Lidio kartı tokenize edip
        // response'da cardToken döner. Bizim callback handler'ımız bu token'ı user_cards'e yazar.
        if (paymentData.saveCardAfterSuccess) {
            newCard.saveAfterSuccess = true;
            if (paymentData.cardNamebyUser) {
                newCard.cardNamebyUser = paymentData.cardNamebyUser;
            }
        }

        return {
            orderId: String(paymentData.orderId || ''),
            merchantProcessId: String(paymentData.merchantProcessId || paymentData.orderId || ''),
            totalAmount: Number(paymentData.amount || 0),
            currency: paymentData.currency || 'TRY',
            customerInfo: this.buildCustomerInfo(paymentData),
            paymentInstrument: 'NewCard',
            paymentInstrumentInfo: { newCard },
            returnUrl: paymentData.returnUrl || paymentData.callbackUrl || undefined,
            notificationUrl: paymentData.notificationUrl || undefined,
            clientIp: paymentData.customerInfo?.customerIpAddress || undefined,
            clientType: 'Web'
        };
    }

    /**
     * Kayıtlı kart ile ödeme — paymentInstrument: "StoredCard"
     * Token user_cards.lidio_token'dan gelir. CVV her ödemede tekrar girilir (PCI gereği).
     */
    buildStoredCardPaymentRequest(paymentData, use3DSecure) {
        const installmentCount = Number(paymentData.installment || 0);

        return {
            orderId: String(paymentData.orderId || ''),
            merchantProcessId: String(paymentData.merchantProcessId || paymentData.orderId || ''),
            totalAmount: Number(paymentData.amount || 0),
            currency: paymentData.currency || 'TRY',
            customerInfo: this.buildCustomerInfo(paymentData),
            paymentInstrument: 'StoredCard',
            paymentInstrumentInfo: {
                storedCard: {
                    processType: 'sales',
                    cardToken: String(paymentData.cardToken || ''),
                    cvv: String(paymentData.cardCvv || ''),
                    use3DSecure: Boolean(use3DSecure),
                    installmentCount,
                    loyaltyPointUsage: 'None'
                }
            },
            returnUrl: paymentData.returnUrl || paymentData.callbackUrl || undefined,
            notificationUrl: paymentData.notificationUrl || undefined,
            clientIp: paymentData.customerInfo?.customerIpAddress || undefined,
            clientType: 'Web'
        };
    }

    /**
     * Anında Havale (DirectWireTransfer) — kullanıcı bankaya yönlendirilir,
     * bankada onay verince ReturnUrl'e döner. Sonra FinishPaymentProcess çağrılır.
     * Lidio dokümantasyonu: paymentInstrumentInfo.directWireTransfer.bankAccountId zorunlu.
     */
    buildDirectWireTransferRequest(paymentData) {
        return {
            orderId: String(paymentData.orderId || ''),
            merchantProcessId: String(paymentData.merchantProcessId || paymentData.orderId || ''),
            totalAmount: Number(paymentData.amount || 0),
            currency: paymentData.currency || 'TRY',
            customerInfo: this.buildCustomerInfo(paymentData),
            paymentInstrument: 'DirectWireTransfer',
            paymentInstrumentInfo: {
                directWireTransfer: {
                    bankAccountId: Number(paymentData.bankAccountId || 0)
                }
            },
            returnUrl: paymentData.returnUrl || paymentData.callbackUrl || undefined,
            notificationUrl: paymentData.notificationUrl || undefined,
            clientIp: paymentData.customerInfo?.customerIpAddress || undefined,
            clientType: 'Web'
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
     * Kayıtlı kart ile ödeme (3DS dahil — paymentData.use3DSecure flag'iyle).
     */
    async processStoredCardPayment(paymentData, runtimeConfig = {}) {
        try {
            const cfg = this.resolveConfig(runtimeConfig);
            if (!cfg.authorization && !cfg.merchantKey && !cfg.apiKey) {
                return {
                    success: true,
                    requires3DS: false,
                    transactionId: `TEST-STORED-${Date.now()}`,
                    status: 'success',
                    message: 'Test stored-card payment (Lidio credentials not configured)',
                    testMode: true
                };
            }

            const requestData = this.buildStoredCardPaymentRequest(paymentData, paymentData.use3DSecure !== false);
            const authHash = this.generateAuthHash(requestData, cfg.secretKey);

            console.info('[lidio:request] processStoredCardPayment', {
                orderId: requestData.orderId,
                totalAmount: requestData.totalAmount,
                hasToken: Boolean(requestData.paymentInstrumentInfo?.storedCard?.cardToken),
                use3DSecure: requestData.paymentInstrumentInfo?.storedCard?.use3DSecure
            });

            const response = await this.postWithFallback(
                cfg, cfg.processPaymentPath, ['/ProcessPayment'], requestData, authHash
            );
            return this.normalizePaymentResponse(response.data);
        } catch (error) {
            console.error('Lidio stored-card payment error:', error.message, error?.response?.data || '');
            throw new Error('Stored card payment failed: ' + error.message);
        }
    }

    /**
     * Anında Havale (DirectWireTransfer) — ilk aşama.
     * Cevap: redirectForm/redirectUrl döner; kullanıcı bankaya gider, dönüşte FinishPaymentProcess çağrılır.
     */
    async processDirectWireTransfer(paymentData, runtimeConfig = {}) {
        try {
            const cfg = this.resolveConfig(runtimeConfig);
            if (!cfg.authorization && !cfg.merchantKey && !cfg.apiKey) {
                return {
                    success: true,
                    requires3DS: true,
                    status: 'success',
                    redirectUrl: `https://test.lidio.com/wire/mock/${Date.now()}`,
                    message: 'Test wire-transfer (Lidio credentials not configured)',
                    testMode: true
                };
            }

            const requestData = this.buildDirectWireTransferRequest(paymentData);
            const authHash = this.generateAuthHash(requestData, cfg.secretKey);

            console.info('[lidio:request] processDirectWireTransfer', {
                orderId: requestData.orderId,
                totalAmount: requestData.totalAmount,
                bankAccountId: requestData.paymentInstrumentInfo?.directWireTransfer?.bankAccountId
            });

            const response = await this.postWithFallback(
                cfg, cfg.processPaymentPath, ['/ProcessPayment'], requestData, authHash
            );
            return this.normalizePaymentResponse(response.data);
        } catch (error) {
            console.error('Lidio direct-wire-transfer error:', error.message, error?.response?.data || '');
            throw new Error('Direct wire transfer failed: ' + error.message);
        }
    }

    /**
     * İki aşamalı ödemenin son adımı (3DS, Anında Havale, BkmExpress, GarantiPay vs).
     * İlk aşamada Lidio bize transactionId verir; client banka/3DS'ten geri döndüğünde
     * bunu çağırırız ki ödeme finansallaşsın.
     */
    async finishPaymentProcess({ transactionId, merchantProcessId } = {}, runtimeConfig = {}) {
        try {
            const cfg = this.resolveConfig(runtimeConfig);
            if (!cfg.authorization && !cfg.merchantKey && !cfg.apiKey) {
                return {
                    success: true,
                    transactionId: transactionId || `TEST-FINISH-${Date.now()}`,
                    status: 'success',
                    testMode: true
                };
            }

            const requestData = {};
            if (transactionId) requestData.transactionId = String(transactionId);
            if (merchantProcessId) requestData.merchantProcessId = String(merchantProcessId);

            const authHash = this.generateAuthHash(requestData, cfg.secretKey);
            console.info('[lidio:request] finishPaymentProcess', { hasTxn: Boolean(transactionId) });

            const response = await this.postWithFallback(
                cfg, cfg.finishPaymentPath, ['/FinishPaymentProcess'], requestData, authHash
            );
            return this.normalizePaymentResponse(response.data);
        } catch (error) {
            console.error('Lidio finishPaymentProcess error:', error.message, error?.response?.data || '');
            throw new Error('Finish payment failed: ' + error.message);
        }
    }

    /**
     * Bağımsız Kart Saklama (SaveCard endpoint'i).
     * NewCard ödemesinde saveAfterSuccess=true verirsek ödeme cevabında token döner;
     * ödemeden bağımsız kart kaydetmek istersek (ör. kullanıcı paneli) bunu kullanırız.
     */
    async saveCard(cardData, runtimeConfig = {}) {
        try {
            const cfg = this.resolveConfig(runtimeConfig);
            if (!cfg.authorization && !cfg.merchantKey && !cfg.apiKey) {
                return {
                    success: true,
                    cardToken: `TEST-TOKEN-${Date.now()}`,
                    testMode: true
                };
            }

            const requestData = {
                customerInfo: {
                    customerId: String(cardData.customerId || ''),
                    email: cardData.email || '',
                    name: cardData.name || '',
                    phone: cardData.phone || ''
                },
                cardHolderName: cardData.cardHolderName || '',
                cardNumber: String(cardData.cardNumber || '').replace(/\s+/g, ''),
                cardMonth: Number(cardData.cardMonth || 0),
                cardYear: Number(cardData.cardYear || 0),
                isTemporary: Boolean(cardData.isTemporary),
                setCardAsDefault: Boolean(cardData.setCardAsDefault),
                clientType: 'Web'
            };
            if (cardData.cardNamebyUser) requestData.cardNamebyUser = cardData.cardNamebyUser;
            if (cardData.groupCode) requestData.groupCode = cardData.groupCode;
            if (cardData.clientIp) requestData.clientIp = cardData.clientIp;
            if (cardData.clientUserAgent) requestData.clientUserAgent = cardData.clientUserAgent;

            const authHash = this.generateAuthHash(requestData, cfg.secretKey);
            console.info('[lidio:request] saveCard', {
                customerId: requestData.customerInfo.customerId,
                isTemporary: requestData.isTemporary
            });

            const response = await this.postWithFallback(
                cfg, cfg.saveCardPath, ['/SaveCard'], requestData, authHash
            );
            return response.data;
        } catch (error) {
            console.error('Lidio saveCard error:', error.message, error?.response?.data || '');
            throw new Error('Save card failed: ' + error.message);
        }
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
