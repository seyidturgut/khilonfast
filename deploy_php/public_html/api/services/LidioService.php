<?php
// api/services/LidioService.php

class LidioService
{
    private $apiUrl;
    private $apiKey;
    private $secretKey;
    private $merchantId;
    private $testMode;

    public function __construct()
    {
        $this->apiUrl = LIDIO_API_URL;
        $this->apiKey = LIDIO_API_KEY;
        $this->secretKey = LIDIO_SECRET_KEY;
        $this->merchantId = LIDIO_MERCHANT_ID;
        $this->testMode = LIDIO_TEST_MODE;
    }

    private function generateAuthHash($data)
    {
        $dataString = json_encode($data);
        return hash_hmac('sha256', $dataString, $this->secretKey);
    }

    public function processPayment($paymentData)
    {
        if (empty($this->apiKey) || $this->apiKey === 'your-lidio-api-key') {
            return [
                'success' => true,
                'transactionId' => 'TEST-' . time(),
                'status' => 'success',
                'message' => 'Test payment successful (Lidio credentials not configured)',
                'amount' => $paymentData['amount'],
                'testMode' => true
            ];
        }

        $requestData = [
            'merchantId' => $this->merchantId,
            'orderId' => $paymentData['orderId'],
            'amount' => $paymentData['amount'],
            'currency' => $paymentData['currency'] ?? 'TRY',
            'cardNumber' => $paymentData['cardNumber'],
            'cardHolderName' => $paymentData['cardHolderName'],
            'cardExpireMonth' => $paymentData['cardExpireMonth'],
            'cardExpireYear' => $paymentData['cardExpireYear'],
            'cardCvv' => $paymentData['cardCvv'],
            'installment' => $paymentData['installment'] ?? 1
        ];

        $authHash = $this->generateAuthHash($requestData);

        $ch = curl_init($this->apiUrl . '/payment/process');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->apiKey,
            'X-Auth-Hash: ' . $authHash
        ]);

        $response = curl_exec($ch);
        curl_close($ch);

        return json_decode($response, true);
    }
}
