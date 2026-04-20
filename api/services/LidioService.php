<?php
// api/services/LidioService.php

class LidioService
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    private function getSetting($key, $default = '')
    {
        $stmt = $this->db->prepare("SELECT setting_value FROM settings WHERE setting_key = ? LIMIT 1");
        $stmt->execute([$key]);
        $row = $stmt->fetch();
        return $row ? $row['setting_value'] : $default;
    }

    private function parseBool($value, $default = false)
    {
        if ($value === null || $value === '') return $default;
        if (is_bool($value)) return $value;
        $v = strtolower(trim((string)$value));
        return in_array($v, ['1', 'true', 'yes', 'on'], true);
    }

    private function resolveConfig()
    {
        $apiUrl = rtrim((string)$this->getSetting('lidio_api_url', 'https://test.lidio.com/api'), '/');
        $testMode = $this->parseBool($this->getSetting('lidio_test_mode', 'true'), true);
        $merchantCode = (string)$this->getSetting('lidio_merchant_code', '');
        $merchantKey = (string)$this->getSetting('lidio_merchant_key', $this->getSetting('lidio_api_key', ''));
        $apiPassword = (string)$this->getSetting('lidio_api_password', $this->getSetting('lidio_secret_key', ''));
        $authorization = trim((string)$this->getSetting('lidio_authorization', ''));
        $processPath = (string)$this->getSetting('lidio_process_3ds_path', '/ProcessPayment');
        if ($processPath === '') $processPath = '/ProcessPayment';
        if ($processPath[0] !== '/') $processPath = '/' . $processPath;

        if ($testMode && $apiUrl === 'https://api.lidio.com') {
            $apiUrl = 'https://test.lidio.com/api';
        }

        return [
            'apiUrl' => $apiUrl,
            'testMode' => $testMode,
            'merchantCode' => $merchantCode,
            'merchantKey' => $merchantKey,
            'apiPassword' => $apiPassword,
            'authorization' => $authorization,
            'processPath' => $processPath
        ];
    }

    private function buildAuthorizationHeader($cfg)
    {
        $rawAuth = trim((string)$cfg['authorization']);
        if ($rawAuth !== '' && preg_match('/^(MxS2S|Bearer|Basic)\s+/i', $rawAuth)) {
            return $rawAuth;
        }

        if (!empty($cfg['merchantKey']) && !empty($cfg['apiPassword'])) {
            return 'MxS2S ' . base64_encode($cfg['merchantKey'] . ':' . $cfg['apiPassword']);
        }

        if ($rawAuth !== '') {
            return 'Bearer ' . $rawAuth;
        }

        return '';
    }

    private function buildCardPaymentRequest($data, $use3d = true, $saveCard = false)
    {
        $month = (int)preg_replace('/\D+/', '', (string)($data['cardExpireMonth'] ?? ''));
        $year = (int)preg_replace('/\D+/', '', (string)($data['cardExpireYear'] ?? ''));
        $installmentCount = max(0, (int)($data['installment'] ?? 0));

        $newCardInfo = [
            'processType' => 'sales',
            'cardInfo' => [
                'cardHolderName' => (string)($data['cardHolderName'] ?? ''),
                'cardNumber' => preg_replace('/\s+/', '', (string)($data['cardNumber'] ?? '')),
                'lastMonth' => $month,
                'lastYear' => $year
            ],
            'cvv' => (string)($data['cardCvv'] ?? ''),
            'use3DSecure' => (bool)$use3d,
            'installmentCount' => $installmentCount,
            'loyaltyPointUsage' => 'None',
            'merchantDataShareApproved' => true,
            'termsConditionsApproved' => true
        ];

        if ($saveCard) {
            $newCardInfo['saveCard'] = true;
        }

        return [
            'orderId' => (string)$data['orderId'],
            'merchantProcessId' => (string)($data['merchantProcessId'] ?? $data['orderId']),
            'totalAmount' => (float)$data['amount'],
            'currency' => (string)($data['currency'] ?? 'TRY'),
            'customerInfo' => [
                'customerId' => (string)($data['customerInfo']['customerId'] ?? ''),
                'name' => trim((string)(($data['customerInfo']['customerName'] ?? '') . ' ' . ($data['customerInfo']['customerSurname'] ?? ''))),
                'email' => (string)($data['customerInfo']['customerEmail'] ?? ''),
                'phone' => (string)($data['customerInfo']['customerPhoneNumber'] ?? '')
            ],
            'paymentInstrument' => 'NewCard',
            'paymentInstrumentInfo' => [
                'newCard' => $newCardInfo
            ],
            'returnUrl' => (string)($data['returnUrl'] ?? ''),
            'notificationUrl' => (string)($data['notificationUrl'] ?? ''),
            'clientIp' => (string)($data['customerInfo']['customerIpAddress'] ?? '')
        ];
    }

    private function buildSavedCardPaymentRequest($data, $token, $use3d = true)
    {
        $installmentCount = max(0, (int)($data['installment'] ?? 0));

        return [
            'orderId' => (string)$data['orderId'],
            'merchantProcessId' => (string)($data['merchantProcessId'] ?? $data['orderId']),
            'totalAmount' => (float)$data['amount'],
            'currency' => (string)($data['currency'] ?? 'TRY'),
            'customerInfo' => [
                'customerId' => (string)($data['customerInfo']['customerId'] ?? ''),
                'name' => trim((string)(($data['customerInfo']['customerName'] ?? '') . ' ' . ($data['customerInfo']['customerSurname'] ?? ''))),
                'email' => (string)($data['customerInfo']['customerEmail'] ?? ''),
                'phone' => (string)($data['customerInfo']['customerPhoneNumber'] ?? '')
            ],
            'paymentInstrument' => 'SavedCard',
            'paymentInstrumentInfo' => [
                'savedCard' => [
                    'processType' => 'sales',
                    'token' => $token,
                    'use3DSecure' => (bool)$use3d,
                    'installmentCount' => $installmentCount,
                    'loyaltyPointUsage' => 'None',
                    'merchantDataShareApproved' => true,
                    'termsConditionsApproved' => true
                ]
            ],
            'returnUrl' => (string)($data['returnUrl'] ?? ''),
            'notificationUrl' => (string)($data['notificationUrl'] ?? ''),
            'clientIp' => (string)($data['customerInfo']['customerIpAddress'] ?? '')
        ];
    }

    public function extractCardToken($lidioResponse)
    {
        if (!is_array($lidioResponse)) return null;

        $candidates = [
            $lidioResponse['cardToken'] ?? null,
            $lidioResponse['savedCardToken'] ?? null,
            $lidioResponse['token'] ?? null,
            isset($lidioResponse['paymentInfo']) ? ($lidioResponse['paymentInfo']['cardToken'] ?? null) : null,
            isset($lidioResponse['paymentInfo']) ? ($lidioResponse['paymentInfo']['savedCardToken'] ?? null) : null,
            isset($lidioResponse['raw']) ? ($lidioResponse['raw']['cardToken'] ?? null) : null,
            isset($lidioResponse['raw']) ? ($lidioResponse['raw']['savedCardToken'] ?? null) : null,
            isset($lidioResponse['raw']['paymentInfo']) ? ($lidioResponse['raw']['paymentInfo']['cardToken'] ?? null) : null,
        ];

        foreach ($candidates as $val) {
            if ($val !== null && $val !== '') {
                return (string)$val;
            }
        }

        return null;
    }

    public function extractMaskedCardNumber($lidioResponse)
    {
        if (!is_array($lidioResponse)) return null;

        $candidates = [
            $lidioResponse['maskedCardNumber'] ?? null,
            $lidioResponse['maskedPan'] ?? null,
            isset($lidioResponse['paymentInfo']) ? ($lidioResponse['paymentInfo']['maskedCardNumber'] ?? null) : null,
            isset($lidioResponse['raw']['paymentInfo']) ? ($lidioResponse['raw']['paymentInfo']['maskedCardNumber'] ?? null) : null,
        ];

        foreach ($candidates as $val) {
            if ($val !== null && $val !== '') {
                return (string)$val;
            }
        }

        return null;
    }

    public function extractCardBrand($lidioResponse)
    {
        if (!is_array($lidioResponse)) return null;

        $candidates = [
            $lidioResponse['cardBrand'] ?? null,
            $lidioResponse['cardType'] ?? null,
            isset($lidioResponse['paymentInfo']) ? ($lidioResponse['paymentInfo']['cardBrand'] ?? null) : null,
            isset($lidioResponse['raw']['paymentInfo']) ? ($lidioResponse['raw']['paymentInfo']['cardBrand'] ?? null) : null,
        ];

        foreach ($candidates as $val) {
            if ($val !== null && $val !== '') {
                return (string)$val;
            }
        }

        return null;
    }

    private function normalizeResponse($raw)
    {
        $payload = is_array($raw) ? $raw : [];
        $redirectUrl = $payload['redirectURL'] ?? $payload['redirectUrl'] ?? null;
        $result = (string)($payload['result'] ?? '');
        $status = strtolower((string)($payload['status'] ?? ''));
        $success = in_array($status, ['success', 'approved', 'completed'], true) || strtolower($result) === 'success';
        $requires3ds = !empty($redirectUrl) || !empty($payload['redirectForm']) || !empty($payload['redirectFormParams']);

        return array_merge($payload, [
            'success' => $success,
            'status' => $status !== '' ? $status : ($success ? 'success' : 'pending'),
            'requires3DS' => $requires3ds,
            'redirectUrl' => $redirectUrl,
            'transactionId' => $payload['transactionId']
                ?? ($payload['paymentInfo']['systemTransId'] ?? null)
                ?? ($payload['systemTransId'] ?? null),
            'raw' => $payload
        ]);
    }

    public function process3DSPayment($data, $saveCard = false)
    {
        $cfg = $this->resolveConfig();
        $requestData = $this->buildCardPaymentRequest($data, true, $saveCard);

        $headers = [
            'Content-Type: application/json'
        ];
        $auth = $this->buildAuthorizationHeader($cfg);
        if ($auth !== '') $headers[] = 'Authorization: ' . $auth;
        if (!empty($cfg['merchantCode'])) $headers[] = 'MerchantCode: ' . $cfg['merchantCode'];

        $url = $cfg['apiUrl'] . $cfg['processPath'];
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($requestData),
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 40
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);

        if ($response === false) {
            throw new Exception('Lidio request failed: ' . $curlErr);
        }

        $decoded = json_decode($response, true);
        if (!is_array($decoded)) {
            throw new Exception('Invalid Lidio response');
        }

        if ($httpCode >= 400) {
            $msg = $decoded['resultMessage'] ?? ('Request failed with status code ' . $httpCode);
            throw new Exception($msg);
        }

        return $this->normalizeResponse($decoded);
    }

    public function processPaymentWithSavedCard($data, $token)
    {
        $cfg = $this->resolveConfig();
        $requestData = $this->buildSavedCardPaymentRequest($data, $token, true);

        $headers = ['Content-Type: application/json'];
        $auth = $this->buildAuthorizationHeader($cfg);
        if ($auth !== '') $headers[] = 'Authorization: ' . $auth;
        if (!empty($cfg['merchantCode'])) $headers[] = 'MerchantCode: ' . $cfg['merchantCode'];

        $url = $cfg['apiUrl'] . $cfg['processPath'];
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($requestData),
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 40
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);

        if ($response === false) {
            throw new Exception('Lidio saved card request failed: ' . $curlErr);
        }

        $decoded = json_decode($response, true);
        if (!is_array($decoded)) {
            throw new Exception('Invalid Lidio saved card response');
        }

        if ($httpCode >= 400) {
            $msg = $decoded['resultMessage'] ?? ('Saved card request failed with status code ' . $httpCode);
            throw new Exception($msg);
        }

        return $this->normalizeResponse($decoded);
    }

    public function startDirectWireTransfer($data)
    {
        // Anında Havale: /ProcessPayment endpoint'i, paymentInstrument: DirectWireTransfer
        // Kullanıcı bankasının online portalına yönlendirilir (redirect flow)
        $cfg = $this->resolveConfig();

        $headers = ['Content-Type: application/json'];
        $auth = $this->buildAuthorizationHeader($cfg);
        if ($auth !== '') $headers[] = 'Authorization: ' . $auth;
        if (!empty($cfg['merchantCode'])) $headers[] = 'MerchantCode: ' . $cfg['merchantCode'];

        $requestData = [
            'orderId'           => (string)($data['orderId'] ?? ''),
            'merchantProcessId' => (string)($data['merchantProcessId'] ?? $data['orderId'] ?? ''),
            'totalAmount'       => (float)($data['amount'] ?? 0),
            'currency'          => (string)($data['currency'] ?? 'TRY'),
            'customerInfo'      => [
                'customerId'  => (string)($data['customerInfo']['customerId'] ?? ''),
                'name'        => trim((string)(($data['customerInfo']['customerName'] ?? '') . ' ' . ($data['customerInfo']['customerSurname'] ?? ''))),
                'email'       => (string)($data['customerInfo']['customerEmail'] ?? ''),
                'phone'       => (string)($data['customerInfo']['customerPhoneNumber'] ?? '')
            ],
            'paymentInstrument'     => 'DirectWireTransfer',
            'paymentInstrumentInfo' => [
                'directWireTransfer' => [
                    'processType'                 => 'sales',
                    'merchantDataShareApproved'   => true,
                    'termsConditionsApproved'     => true
                ]
            ],
            'returnUrl'       => (string)($data['returnUrl'] ?? ''),
            'notificationUrl' => (string)($data['notificationUrl'] ?? ''),
            'clientIp'        => (string)($data['customerInfo']['customerIpAddress'] ?? '')
        ];

        $url = $cfg['apiUrl'] . $cfg['processPath'];
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($requestData),
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_TIMEOUT        => 40
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr  = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            throw new Exception('Lidio wire transfer request failed: ' . $curlErr);
        }

        $decoded = json_decode($response, true);
        if (!is_array($decoded)) {
            throw new Exception('Invalid Lidio wire transfer response');
        }

        if ($httpCode >= 400) {
            $msg = $decoded['resultMessage'] ?? ('Wire transfer request failed with status code ' . $httpCode);
            throw new Exception($msg);
        }

        $normalized = $this->normalizeResponse($decoded);
        $normalized['requiresRedirect'] = !empty($normalized['redirectUrl']);

        return $normalized;
    }

    public function startHostedPaymentProcess($data)
    {
        $cfg = $this->resolveConfig();
        $hostedPath = (string)$this->getSetting('lidio_start_hosted_payment_path', '/StartHostedPaymentProcess');
        if ($hostedPath === '') $hostedPath = '/StartHostedPaymentProcess';
        if ($hostedPath[0] !== '/') $hostedPath = '/' . $hostedPath;

        $headers = [
            'Content-Type: application/json'
        ];
        $auth = $this->buildAuthorizationHeader($cfg);
        if ($auth !== '') $headers[] = 'Authorization: ' . $auth;
        if (!empty($cfg['merchantCode'])) $headers[] = 'MerchantCode: ' . $cfg['merchantCode'];

        $hostedOrderId = preg_replace('/[^a-zA-Z0-9_]/', '', (string)($data['hostedOrderId'] ?? $data['orderId'] ?? ''));
        $hostedOrderId = substr($hostedOrderId, 0, 20);
        if ($hostedOrderId === '') {
            $hostedOrderId = 'ORD' . substr((string)time(), -8);
        }

        $requestData = [
            'orderId' => $hostedOrderId,
            'merchantProcessId' => (string)($data['merchantProcessId'] ?? $data['orderId'] ?? $hostedOrderId),
            'totalAmount' => (float)($data['amount'] ?? 0),
            'currency' => (string)($data['currency'] ?? 'TRY'),
            'customerInfo' => [
                'customerId' => (string)($data['customerInfo']['customerId'] ?? ''),
                'name' => (string)($data['customerInfo']['customerName'] ?? ''),
                'surname' => (string)($data['customerInfo']['customerSurname'] ?? ''),
                'email' => (string)($data['customerInfo']['customerEmail'] ?? ''),
                'phoneNumber' => (string)($data['customerInfo']['customerPhoneNumber'] ?? ''),
                'ipAddress' => (string)($data['customerInfo']['customerIpAddress'] ?? '')
            ],
            'paymentInstruments' => ['NewCard'],
            'paymentInstrumentInfo' => [
                'newCard' => [],
                'NewCard' => []
            ],
            'returnUrl' => (string)($data['returnUrl'] ?? ''),
            'notificationUrl' => (string)($data['notificationUrl'] ?? '')
        ];

        $url = $cfg['apiUrl'] . $hostedPath;
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($requestData),
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 40
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);

        if ($response === false) {
            throw new Exception('Lidio hosted request failed: ' . $curlErr);
        }

        $decoded = json_decode($response, true);
        if (!is_array($decoded)) {
            throw new Exception('Invalid Lidio hosted response');
        }

        if ($httpCode >= 400) {
            $msg = $decoded['resultMessage'] ?? ('Hosted request failed with status code ' . $httpCode);
            throw new Exception($msg);
        }

        return $this->normalizeResponse($decoded);
    }
}
