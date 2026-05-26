# Khilonfast — E-posta Akışları Referansı

**Sürüm:** 4 Mayıs 2026 | **Mail altyapısı:** Brevo HTTP API (port 443) → SMTP fallback

Bu döküman projedeki **tüm otomatik mail tetikleyicilerini** ve hangi olaydan sonra hangi mailin atıldığını gösterir.

---

## 1. Mail altyapısı

| Bileşen | Konum |
|---|---|
| Wrapper | `api/utils.php` → `sendTransactionalEmail($db, $to, $subject, $html)` |
| HTTP API | `api/utils.php` → `sendBrevoApiEmail()` (Brevo `api.brevo.com/v3/smtp/email`) |
| SMTP fallback | `api/utils.php` → `sendSmtpEmail()` (cPanel'de portlar bloklu, kullanılmıyor) |

**Tercih sırası:** `settings.brevo_api_key` doluysa **Brevo API**, yoksa SMTP'ye düşer (üretimde kullanılmıyor).

**Settings tablosu — gerekli anahtarlar:**

```
brevo_api_key        → xkeysib-... (HTTP API key)
contact_email        → info@khilonfast.com  (gönderici + admin alıcı)
sender_name          → Khilonfast
smtp_host/user/pass  → SMTP fallback (boş bırakılabilir)
```

---

## 2. Auth & Hesap Akışları

### 2.1 Yeni Kayıt — Welcome (Guest Checkout)

| | |
|---|---|
| **Tetikleyici** | Misafir kullanıcı checkout'ta sipariş oluşturur (kayıtlı değilse otomatik kayıt) |
| **Tetikleyen kod** | `api/routes/orders.php:118` → `sendWelcomeAccountEmail($db, ...)` |
| **Konu** | "Khilonfast - Hesabınız Hazır, Şifrenizi Belirleyin" |
| **Alıcı** | Sipariş veren misafir |
| **İçerik** | "Şifremi Belirle" butonu — JWT linkli (7 gün geçerli) |
| **Locale** | TR (ileride EN'ye genişletilebilir) |

### 2.2 Şifremi Unuttum

| | |
|---|---|
| **Tetikleyici** | `/sifremi-unuttum` (TR) veya `/en/forgot-password` (EN) formdan submit |
| **Tetikleyen kod** | `api/routes/auth.php:259` → forgot-password endpoint |
| **Konu** | TR: "Khilonfast — Şifre Sıfırlama Talebi" / EN: "Khilonfast — Reset Your Password" |
| **Alıcı** | Email submit eden kullanıcı (kayıtlıysa) |
| **İçerik** | "Şifremi Sıfırla" butonu — 1 saat geçerli JWT |
| **Locale** | ✅ TR/EN locale'a göre |

> **Not:** Email kayıtlı değilse de aynı "gönderildi" mesajı döner (enumeration koruması).

---

## 3. Sipariş / Ödeme Akışları

Üç ödeme yöntemi var:
- **Lidio kart** (3DS, anlık) — TR locale veya admin toggle açıksa EN'de de
- **Manuel havale (IBAN)** — Lidio bağımsız, EN default + TR seçeneği
- **Ücretsiz sipariş** — %100 kupon ile 0 TRY

### 3.1 Lidio Kart Ödemesi → BAŞARILI

| Aşama | Mail |
|---|---|
| 3DS başarılı + FinishPaymentProcess | `payment.php` callback'i → orders status `completed` |
| **Müşteri** | `email_events.purchase_completed` event yazılır → otomatik sequence tetiklenir (3 gün sonra "İçeriklerinize erişmeyi unutmayın" hatırlatma maili) |
| **Müşteri (hizmet/sektör/eye-tracking aldıysa)** | **Onboarding link maili** → "Onboarding Formunuzu Doldurun" + form linki |
| **Locale** | ✅ TR/EN — `orders.customer_lang` kolonundan |

**Tetikleyen kod:** `api/routes/payment.php:765-840`

### 3.2 Lidio Kart Ödemesi → BAŞARISIZ (Refused/Risk)

Mail gönderilmez. Sipariş `failed` olur, kupon kullanımı geri alınır. Frontend'de hata mesajı gösterilir.

### 3.3 Manuel Havale → Sipariş Verildi (henüz ödeme alınmadı)

| Aşama | Mail |
|---|---|
| Müşteri "Siparişi Ver" tıklar | `payment.php` `manual-transfer` action |
| **Müşteri (#1)** | "Bank Transfer Pending — ORDER-XXX" → IBAN tablosu + sipariş no |
| **Admin (#2)** | "[Khilonfast] Manual Transfer Pending — ORDER-XXX" → kısa Türkçe bildirim, `contact_email`'a gider |
| **Locale (müşteri maili)** | ✅ TR/EN |

**Tetikleyen kod:** `api/routes/payment.php:618-642`

### 3.4 Manuel Havale → Admin Onayı

| Aşama | Mail |
|---|---|
| Admin `/admin/manual-orders` → "Ödemeyi Onayla" | `admin.php` → `confirm-manual-payment` |
| Subscriptions oluşur, order `completed` | |
| **Müşteri (#1)** | "Payment Confirmed — ORDER-XXX" → "Ödemeniz alındı, hesabınızdan erişebilirsiniz" + Dashboard butonu |
| **Müşteri (#2 — sadece hizmet/sektör ürün varsa)** | "Onboarding Formunuzu Doldurun" → form linki |
| **email_events** | `purchase_completed` event yazılır → 3 gün sonra otomatik içerik erişim hatırlatma sequence'i |
| **Locale** | ✅ TR/EN |

**Tetikleyen kod:** `api/routes/admin.php:2580-2640`

### 3.5 Manuel Havale → Cron Hatırlatması (3-6 gün)

| Aşama | Mail |
|---|---|
| Cron her gün 09:00 | `api/routes/manual-transfer-cron.php` |
| 3-6 gün arası pending sipariş için günde max 1 mail | |
| **Müşteri** | "Reminder: Bank Transfer Pending — ORDER-XXX" → IBAN tekrar + "4 gün içinde otomatik iptal" uyarısı |
| **Locale** | ✅ TR/EN |

**Cron komutu:** `curl -s -X POST "https://khilonfast.com/api/manual-transfer/cron" -H "X-Cron-Key: <settings.manual_transfer_cron_key>"`

### 3.6 Manuel Havale → Otomatik İptal (7+ gün)

| Aşama | Mail |
|---|---|
| Cron her gün | Aynı endpoint |
| Sipariş `cancelled` olur, kupon serbest bırakılır | |
| **Müşteri** | "Order Cancelled — ORDER-XXX" → "7 gün içinde havale alınmadı" + "yeni sipariş ver" CTA |
| **Locale** | ✅ TR/EN |

### 3.7 Ücretsiz Sipariş (TEAM100 vb. %100 kupon)

`orders.php`'de free-order detection var. Sipariş hemen `completed`, subscription oluşur. **Şu an müşteriye ayrı bir onay maili yok** — sadece `email_events.purchase_completed` event ile sequence tetiklenir (3 gün sonra hatırlatma).

> **İyileştirme önerisi:** Ücretsiz siparişlere de "Siparişiniz onaylandı" maili eklenebilir.

---

## 4. Onboarding Form Akışları

### 4.1 Müşteri Onboarding Formunu Doldurur

| Aşama | Mail |
|---|---|
| `/onboarding-formu?order_id=X` formu submit | `api/routes/onboarding.php` |
| **Önkoşul:** order status = `completed` (pending'de form kabul edilmez) | |
| **Admin** | "Yeni Onboarding Formu — [Müşteri Adı]" → tüm form bölümleri tablo halinde |
| **Müşteri** | "Onboarding Formunuz Alındı — Khilonfast" → kısa onay |
| **Locale** | ⚠️ TR sabit (admin için TR mantıklı, müşteri için ileride locale'a geçilebilir) |

**Tetikleyen kod:** `api/routes/onboarding.php:240-251`

---

## 5. Email Automation Sequences (Otomatik Sekanslar)

`email_queue` + `email_sequences` + `email_events` tabloları üzerine kurulu otomatik akış sistemi. Cron çalıştırır.

**Tetikleyen kod:** `api/routes/email-automation.php:411` → `sendTransactionalEmail($db, $email, $row['subject'], $html)`

### 5.1 Sekans: Terk Edilmiş Sepet (`checkout_abandoned`)

`email_events.checkout_email_entered` yazılınca tetiklenir (kullanıcı checkout email kutusuna yazıp sipariş tamamlamadan ayrılırsa). 6 mail gider:

| # | Gecikme | Konu |
|---|---|---|
| 1 | 1 saat | İşleminizi sadece 2 dakikada tamamlayabilirsiniz! |
| 2 | 1 gün | Aradığınız Çözümlere Ulaşmak İçin Son 1 Adım! |
| 3 | 3 gün | Biz başlamaya hazırız! Ya siz? |
| 4 | 7 gün | İşleminizi birlikte tamamlamak ister misiniz? |
| 5 | 30 gün | khilonfast Çözümleri Hala Gündeminizde Mi? |
| 6 | 90 gün | khilonfast Çözümlerine Göz Atmak İster Misiniz? |

**İptal koşulu:** Aynı email ile `purchase_completed` event'i gelirse pending kuyruktaki tüm mailler `cancelled` olur.

### 5.2 Sekans: Satın Alma Sonrası İçerik Hatırlatma (`purchase_completed`)

Satın alma sonrası 3 gün boyunca dashboard'a giriş yapılmazsa 1 mail gider:

| # | Gecikme | Konu |
|---|---|---|
| 1 | 3 gün | Satın aldığınız içeriklere erişmeyi unutmayın! |

**Restart koşulu:** Sequence completion sonrası restart yok (`restart_after_days = NULL`).

> Tüm sequence içeriği TR — locale-aware değil. Email-automation şu an EN müşteri için TR mail gönderebilir.

---

## 6. Cron Görevleri

cPanel cron jobs paneli üzerinden tanımlanır.

| İş | Endpoint | Sıklık | Açıklama |
|---|---|---|---|
| **Email queue işle** | `POST /api/email-automation/process` | Saatte 1 | Pending email_queue satırlarını gönderir, 50/run limit |
| **Manuel havale takip** | `POST /api/manual-transfer/cron` | Günde 1 (09:00) | 3+ gün → hatırlatma, 7+ gün → iptal |

**Auth:** Her ikisi de `X-Cron-Key` header'ı ile korunur (settings: `email_cron_key`, `manual_transfer_cron_key`).

---

## 7. Locale (TR/EN) Durumu

| Mail | Locale Aware? |
|---|---|
| Welcome (guest) | ❌ TR sabit |
| Forgot password | ✅ TR/EN |
| Lidio başarılı + onboarding link | ✅ TR/EN |
| Manuel havale: pending/confirmed/reminder/cancelled | ✅ TR/EN |
| Manuel havale: onboarding link | ✅ TR/EN |
| Onboarding form: müşteri onay | ❌ TR sabit |
| Onboarding form: admin bildirim | ❌ TR sabit (admin için doğru) |
| Email sequences (terk edilmiş sepet, içerik hatırlatma) | ❌ TR sabit |

**Locale kaynağı:** `orders.customer_lang` kolonu (frontend `Checkout.tsx` `lang: isEn ? 'en' : 'tr'` gönderir).

---

## 8. Akış Şeması — Hangi Olay Hangi Maili Tetikler

```
┌─────────────────────────────────────────────────────────────┐
│ MİSAFİR CHECKOUT'A GİRER                                    │
│  └─→ email_events.checkout_email_entered yazılır            │
│       └─→ Sequence "Terk Edilmiş Sepet" başlar             │
│            (1h, 1d, 3d, 7d, 30d, 90d hatırlatma mailleri)  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ (sipariş verir)
┌─────────────────────────────────────────────────────────────┐
│ SİPARİŞ OLUŞTURULUR                                         │
│  ├─→ Misafirse → Welcome maili (Şifrenizi Belirleyin)       │
│  └─→ Email automation: pending kuyruk cancelled              │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌─────────────────────┐           ┌─────────────────────┐
│ LİDİO KART          │           │ MANUEL HAVALE        │
│  └─→ 3DS akışı       │           │  ├─→ Müşteri: pending │
│                      │           │  │    + IBAN bilgisi  │
│  ✓ Başarılı:         │           │  └─→ Admin: bildirim  │
│  ├─→ purchase_       │           │                       │
│  │   completed event │           │  Admin onayladığında: │
│  ├─→ Onboarding      │           │  ├─→ purchase_event   │
│  │   link maili      │           │  ├─→ Onay maili       │
│  │   (hizmet/sektör) │           │  ├─→ Onboarding link  │
│  └─→ Sequence: 3 gün │           │  │   maili (hizmet)   │
│      sonra hatırlatma│           │  └─→ Sequence: 3 gün  │
│                      │           │      sonra hatırlatma │
│  ✗ Refused: mail yok │           │                       │
│                      │           │  3-6 gün ödeme yok:   │
│                      │           │  └─→ Hatırlatma maili │
│                      │           │                       │
│                      │           │  7+ gün ödeme yok:    │
│                      │           │  └─→ İptal maili      │
└─────────────────────┘           └─────────────────────┘
                            │
                            ▼ (sipariş hizmet/sektör ürün ise)
┌─────────────────────────────────────────────────────────────┐
│ KULLANICI ONBOARDING FORMUNU DOLDURUR                       │
│  ├─→ Admin: form özeti maili                                 │
│  └─→ Müşteri: "form alındı" onay maili                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Mail Şablonları — Görsel Örnek

Tüm mailler **gradient header** (lacivert→yeşil) + beyaz body ile aynı tasarım dilini kullanır.

```
┌─────────────────────────────────────┐
│ [Gradient header]                    │
│  H2: Mail Konusu                     │
├─────────────────────────────────────┤
│  Merhaba {first_name},               │
│                                      │
│  [Açıklama metni]                    │
│                                      │
│  [IBAN tablosu - sadece havale için] │
│  [CTA buton - varsa]                 │
│                                      │
│  ─────────────────────────           │
│  Khilonfast — info@khilonfast.com    │
└─────────────────────────────────────┘
```

---

## 10. Test & Debug

### Test mailleri elle göndermek

```bash
# Lokal'den direct (PHP CLI)
cd /Users/seyidturgut/Works/Khilon/khilonfast.com/web2026/api
php -r "require 'utils.php'; sendBrevoApiEmail('xkeysib-...', 'info@khilonfast.com', 'Khilonfast', 'test@example.com', 'Test', '<p>Hello</p>');"
```

### Brevo logs

`https://app.brevo.com/transactional/statistics/email/email` — son maillerin Sent/Delivered/Bounced/Spam durumu.

### Hata teşhis

| Belirti | Kontrol |
|---|---|
| Mail hiç gitmiyor | Brevo logs'da kayıt var mı? Yoksa SMTP/API config kontrolü |
| Mail spam'a düşüyor | Brevo Domain Auth (DKIM/SPF/DMARC) tamamlanmış mı? |
| 401 Brevo unauthorized IP | `https://app.brevo.com/security/authorised_ips` → prod IP whitelist |
| `Action not found` | `api/index.php` route mapping eksik |
| Locale yanlış | `orders.customer_lang` doğru kaydedildi mi? |

---

## 11. V2 Otomasyonlar (Mayıs 2026 Sheet seed)

Müşteri Sheet'inden seed edilen 9 otomasyon akışı + 39 e-posta şablonu. Tümü **`draft`** durumda — admin panelden aktive edilir.

JSON kaynakları:
- `api/migrations/automation_v2_templates.json` — 39 e-posta
- `api/migrations/automation_v2_flows.json` — 9 akış
- `api/migrations/seed_automation_v2.php` — idempotent seed (mevcutları atlar)

| # | Akış | Trigger | Step sayısı |
|---|---|---|---|
| 6  | Aylık Hizmetler — Sepet Terk | `checkout_abandoned` | 4 |
| 7  | Aylık Hizmetler — Form Beklemede | `purchase_completed_no_onboarding` | 6 |
| 8  | Eğitim — Satın Aldı Başlamadı | `course_purchased_not_started` | 5 |
| 9  | Eğitim — Başladı Tamamlamadı | `course_started_incomplete` | 1 |
| 10 | Eğitim — Tamamlandı (X-sell) | `course_completed` | 3 |
| 11 | Eğitim — Yıllık Reactivation | `course_yearly_reactivation` | 3 |
| 12 | Danışmanlık — Randevu Akışı | `consulting_appointment` | 3 (event-driven) |
| 13 | Maestro AI — Lifecycle | `maestro_lifecycle` | 3 |
| 14 | Eye Tracking — Görsel Yükleme Beklemede | `eyetracking_pending_upload` | 5 |

### Yeni event type'ları (cron tetikleyicisi gerekiyor)

Şu an mevcut email automation cron'u sadece `checkout_abandoned` ve `purchase_completed` event'lerini handle ediyor. V2 yeni event'ler için backend trigger kodu yazılmalı:

- `course_purchased_not_started` — order tamamlandığında, training kategorisinde ürün varsa tetiklenir
- `course_started_incomplete` — `subscriptions.starts_at` + 1 ay sonra, `has_started=true` AND `course_completed=false`
- `course_completed` — admin tarafından eğitim tamamlandı işaretlemesi (manuel veya otomatik kriter)
- `consulting_appointment_*` — bookings tablosu üzerinden tetiklenir
- `maestro_lifecycle` — purchase + 2 gün cron + payment_failed event'i
- `eyetracking_pending_upload` — purchase tamamlandıktan sonra görsel yüklenmediyse

Bu event'leri tetikleyecek cron/trigger kodları **henüz yazılmadı** — mevcut akışlar `draft` durumda admin panelden manuel başlatılabilir veya gerçekleştirici kod sonradan eklenir.

## 12. İleride Eklenebilecek Akışlar

- ✏️ **Welcome maili** EN locale ekle
- ✏️ **Ücretsiz sipariş onay maili** (TEAM100 vb.)
- ✏️ **Email sequences** locale-aware
- ✏️ **Onboarding form alındı** maili EN
- ✏️ **Refund/iade** maili
- ✏️ **Newsletter / pazarlama** sekansları
- ✏️ V2 akış event tetikleyicileri (cron + trigger kod)
