<?php
// api/routes/company.php

$db = Database::getInstance();
$payload = requireAuth();

if ($method === 'GET' && empty($action)) {
    $stmt = $db->prepare("SELECT * FROM company_info WHERE user_id = ?");
    $stmt->execute([$payload['id']]);
    $row = $stmt->fetch();
    sendResponse($row ?: null);
}

if ($method === 'POST' && empty($action)) {
    $data = getJsonBody();
    $companyName = trim((string)($data['company_name'] ?? ''));
    $taxNumber = trim((string)($data['tax_number'] ?? ''));
    $companyAddress = trim((string)($data['company_address'] ?? ''));
    $companyPhone = trim((string)($data['company_phone'] ?? ''));

    $stmt = $db->prepare("SELECT id FROM company_info WHERE user_id = ?");
    $stmt->execute([$payload['id']]);
    $existing = $stmt->fetch();

    if ($existing) {
        $stmt = $db->prepare(
            "UPDATE company_info SET company_name = ?, tax_number = ?, company_address = ?, company_phone = ? WHERE user_id = ?"
        );
        $stmt->execute([$companyName, $taxNumber, $companyAddress, $companyPhone, $payload['id']]);
    } else {
        $stmt = $db->prepare(
            "INSERT INTO company_info (user_id, company_name, tax_number, company_address, company_phone) VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->execute([$payload['id'], $companyName, $taxNumber, $companyAddress, $companyPhone]);
    }

    $stmt = $db->prepare("SELECT * FROM company_info WHERE user_id = ?");
    $stmt->execute([$payload['id']]);
    $company = $stmt->fetch();

    sendResponse([
        'message' => 'Company info saved successfully',
        'company' => $company
    ]);
}

sendResponse(['error' => 'Action not found'], 404);

