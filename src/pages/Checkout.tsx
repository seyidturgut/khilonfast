import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { couponAPI, emailAutomationAPI, ordersAPI, paymentAPI } from '../services/api';
import { HiCheckCircle, HiCreditCard, HiShieldCheck, HiShoppingBag, HiLibrary } from 'react-icons/hi';

interface SavedCard {
    id: number;
    masked_number: string;
    card_brand: string | null;
    expire_month: number;
    expire_year: number;
    card_holder_name: string | null;
    is_default: boolean;
}
import './Checkout.css';
import { getLocalizedPathByKey, useRouteLocale } from '../utils/locale';
import { API_BASE_URL } from '../config/api';
import ConsentCheckboxes, { type ConsentState } from '../components/ConsentCheckboxes';

interface CheckoutPricingSummary {
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
    currency: string;
    applied_coupon: {
        id: number;
        name: string;
        code: string;
        description?: string;
        discount_type: 'percentage' | 'fixed';
        discount_value: number;
        maximum_discount_amount?: number | null;
        is_stackable?: boolean;
    } | null;
}

export default function Checkout() {
    useTranslation('common');
    const useHostedPayment = false;
    const API_BASE = API_BASE_URL;
    const { user, isAuthenticated, activateToken } = useAuth();
    const { items, clearCart, refreshPrices, isEnLocale } = useCart();
    // EN locale + bank-only mode: kart tab'ını gizle, default'u wire_transfer yap
    const enBankOnly = isEnLocale;
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as { email?: string; name?: string; country?: string } | null;
    const currentLang = useRouteLocale();
    const isEn = currentLang === 'en';
    const homePath = getLocalizedPathByKey(currentLang, 'home');
    const dashboardPath = getLocalizedPathByKey(currentLang, 'dashboard');
    const onboardingFormPath = getLocalizedPathByKey(currentLang, 'onboardingForm');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    
    // Danışmanlık ürünü sepetteyse sözleşme adımları ATLANMAZ — kullanıcı
    // mesafeli satış / ön bilgilendirme dahil sözleşmeleri açıkça onaylamalı (docx beklentisi).
    const hasConsultantItem = items.some(
        i => (i.product_key || '').toLowerCase().startsWith('consultant-service-')
    );
    // Auto-advance logic: if coming with guest info, start at Step 3 (Payment)
    const [step, setStep] = useState<1 | 2 | 3>(state?.email && !hasConsultantItem ? 3 : 1);
    const autoAccepted = !!state?.email && !hasConsultantItem;
    // Eski 4 ayrı zorunlu checkbox + ETK → tek ConsentCheckboxes
    const [consentState, setConsentState] = useState<ConsentState>({
        main_legal: autoAccepted,
        etk: false,
        b2b: false,
        auto_renewal: false,
    });
    const allPoliciesAccepted = consentState.main_legal;
    // Step 2: her sözleşme için ayrı checkbox state
    const [policyChecks, setPolicyChecks] = useState<Record<string, boolean>>({});
    const [country, setCountry] = useState(state?.country || 'Türkiye');
    const [email, setEmail] = useState(state?.email || user?.email || '');
    const [buyingAsBusiness, setBuyingAsBusiness] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [taxNumber, setTaxNumber] = useState('');
    // Fatura için (Türk vergi mevzuatı — zorunlu)
    const [nationalId, setNationalId] = useState(''); // TC kimlik (bireysel, 11 hane)
    const [taxOffice, setTaxOffice] = useState('');   // Vergi dairesi (kurumsal)
    const [cardHolderName, setCardHolderName] = useState(state?.name || '');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpireMonth, setCardExpireMonth] = useState('');
    const [cardExpireYear, setCardExpireYear] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const hasSubscription = useMemo(() => items.some(i => (i.duration_days ?? 0) > 0), [items]);
    const hasMaestroItem = useMemo(
        () => items.some(i => (i.product_key || '').toLowerCase().startsWith('maestro-')),
        [items]
    );
    const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
    const [selectedCardId, setSelectedCardId] = useState<number>(0); // 0 = yeni kart
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'wire_transfer'>(
        (typeof window !== 'undefined' && (window.location.pathname === '/en' || window.location.pathname.startsWith('/en/')))
            ? 'wire_transfer'
            : 'card'
    );
    const [wireTransferResult, setWireTransferResult] = useState<any>(null);
    type ManualBankAccount = { id: number; bank_name: string; account_holder?: string; iban?: string; swift?: string | null; currency?: 'TRY' | 'USD'; notes?: string | null; bank_code?: string | null; logo_url?: string | null };
    const [bankAccounts, setBankAccounts] = useState<ManualBankAccount[]>([]);
    const [selectedBankId, setSelectedBankId] = useState<number>(0);
    const [couponCode, setCouponCode] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [pricingSummary, setPricingSummary] = useState<CheckoutPricingSummary | null>(null);
    const [showExitIntent, setShowExitIntent] = useState(false);
    const emailEventSentRef = useRef(false);
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const copy = useMemo(() => ({
        stepTitles: {
            info: isEn ? 'Purchase Information' : 'Satın Alma Bilgileri',
            terms: isEn ? 'Terms of Service' : 'Hizmet Şartları',
            payment: isEn ? 'Payment' : 'Ödeme'
        },
        steps: {
            info: isEn ? 'Information' : 'Bilgiler',
            terms: isEn ? 'Terms' : 'Şartlar',
            payment: isEn ? 'Payment' : 'Ödeme'
        },
        intro: {
            infoTitle: isEn ? 'Purchase details' : 'Satın alma bilgileri',
            infoDescription: isEn ? 'Confirm the essential details before continuing.' : 'Devam etmeden önce temel bilgileri doğrulayın.',
            termsTitle: isEn ? 'Terms of Service' : 'Hizmet Şartları',
            termsDescription: isEn ? 'Scroll to the end of the text to continue.' : 'Devam etmek için metnin sonuna kadar inin.'
        },
        fields: {
            country: isEn ? 'Country' : 'Ülke',
            email: isEn ? 'Email' : 'E-posta',
            privacyAccepted: isEn ? 'I have read and accept the privacy policy.' : 'Gizlilik politikasını okudum, kabul ediyorum.',
            businessPurchase: isEn ? 'I am purchasing as a business' : 'İşletme olarak satın alıyorum',
            companyName: isEn ? 'Company Name' : 'İşletme Adı',
            taxNumber: isEn ? 'Tax / VAT Number' : 'VKN / Vergi Numarası',
            cardName: isEn ? 'Name on Card' : 'Kart Üzerindeki İsim',
            cardNumber: isEn ? 'Card Number' : 'Kart Numarası',
            expireMonth: isEn ? 'Expiry Month' : 'Son Kullanma Ay',
            expireYear: isEn ? 'Expiry Year' : 'Son Kullanma Yıl'
        },
        buttons: {
            continue: isEn ? 'Continue' : 'Devam Et',
            acceptTerms: isEn ? 'Accept and Continue' : 'Kabul Et ve Devam Et',
            processing: isEn ? 'Processing...' : 'İşleniyor...',
            completePayment: isEn ? 'Complete Payment' : 'Ödemeyi Tamamla',
            buyAndPay: isEn ? 'Buy and Pay' : 'Satın Al ve Öde'
        },
        terms: {
            title: isEn ? 'Khilonfast Terms of Service' : 'Khilonfast Hizmet Şartları',
            hint: isEn ? 'The “Accept and Continue” button becomes active after you reach the end of the text.' : 'Yazının sonuna indiğinizde “Kabul Et ve Devam Et” butonu aktif olur.',
            items: isEn
                ? [
                    'Digital services and content purchased through this platform are assigned to the purchasing user account.',
                    'After the purchase is completed, access is provided from the “My Content” area in the user panel.',
                    'The user is responsible for providing accurate account and payment information.',
                    'Sharing the provided content with third parties is prohibited.',
                    'Unauthorized reproduction, distribution, or commercial reuse of the content is not allowed.',
                    'Khilonfast may perform planned service interruptions due to technical maintenance and infrastructure updates.',
                    'The user completes the purchase after reviewing the product scope and content.',
                    'Payments are processed securely through the integrated virtual POS infrastructure.',
                    'For business purchases, declared tax information is used for invoicing.',
                    'Financial liabilities caused by incorrect or incomplete declarations belong to the user.',
                    'Khilonfast may share records with authorized institutions when legally required.',
                    'Continuing to use the platform means the conditions stated here are accepted.',
                    'These terms may be updated when necessary, and the current text is published on the platform.',
                    'Once you read and approve all terms, you can move to the next step.',
                    'This text is a placeholder. You can replace it with your final legal copy.'
                ]
                : [
                    'Bu platform üzerinden satın alınan dijital hizmet ve içerikler, satın alma yapan kullanıcı hesabına tanımlanır.',
                    'Satın alma işlemi tamamlandıktan sonra kullanıcı panelindeki “İçeriklerim” alanından erişim sağlanır.',
                    'Kullanıcı, hesabını ve ödeme bilgilerini doğru beyan etmekle yükümlüdür.',
                    'Hizmet kapsamında sağlanan içeriklerin üçüncü kişilerle paylaşılması yasaktır.',
                    'İçeriklerin izinsiz çoğaltılması, dağıtılması veya ticari amaçla yeniden kullanımı kabul edilmez.',
                    'Khilonfast, teknik bakım ve altyapı güncellemeleri nedeniyle hizmette planlı kesinti yapabilir.',
                    'Kullanıcı, satın alma öncesi ürün içeriğini ve kapsamını kontrol ederek işlem yapar.',
                    'Ödeme işlemleri, entegre sanal POS altyapısı üzerinden güvenli şekilde yürütülür.',
                    'İşletme adına yapılan satın alımlarda beyan edilen vergi bilgileri faturalandırma için esas alınır.',
                    'Yanlış veya eksik beyanlardan kaynaklı mali yükümlülük kullanıcıya aittir.',
                    'Khilonfast, hukuki yükümlülük durumlarında kayıtları ilgili mercilerle paylaşabilir.',
                    'Platform kullanımına devam edilmesi, burada belirtilen şartların kabul edildiği anlamına gelir.',
                    'Bu şartlar gerektiğinde güncellenebilir ve güncel metin platform üzerinde yayımlanır.',
                    'Şartların tamamını okuyup onayladığınızda bir sonraki adıma geçebilirsiniz.',
                    'Bu metin örnek amaçlıdır. Nihai hukuki metinlerinizi bu alana ekleyip kullanabilirsiniz.'
                ]
        },
        summary: {
            title: isEn ? 'Order Summary' : 'Sipariş Özeti',
            subtotal: isEn ? 'Subtotal (excl. VAT)' : 'Ara toplam (KDV hariç)',
            discount: isEn ? 'Coupon Discount' : 'Kupon indirimi',
            shipping: isEn ? 'Shipping' : 'Kargo',
            tax: isEn ? 'VAT (20%)' : 'KDV (%20)',
            total: isEn ? 'Total:' : 'Genel toplam',
            couponLabel: isEn ? 'Coupon code' : 'Kupon kodu',
            couponApplied: isEn ? 'Applied coupon' : 'Kullanılan kupon',
            apply: isEn ? 'Apply' : 'Uygula',
            remove: isEn ? 'Remove' : 'Kaldır',
            applying: isEn ? 'Applying...' : 'Uygulanıyor...'
        },
        payment: {
            title: isEn ? 'Payment Method' : 'Ödeme Yöntemi',
            providerTitle: isEn ? 'Lidio Virtual POS' : 'Lidio Sanal POS',
            providerDescription: isEn ? 'Your payment will be completed through secure payment infrastructure.' : 'Ödemeniz güvenli ödeme altyapısı üzerinden tamamlanacaktır.',
            hostedTitle: isEn ? 'Card details will be entered on the Lidio screen' : 'Kart bilgisi Lidio ekranında girilecek',
            hostedDescription: isEn ? 'After clicking the buy button, you will be redirected to the secure Lidio payment page.' : 'Satın al butonundan sonra güvenli Lidio ödeme sayfasına yönlendirileceksiniz.',
            tabCard: isEn ? 'Credit / Debit Card' : 'Kredi / Banka Kartı',
            tabWire: isEn ? 'Pay by Wire Transfer' : 'Havale ile Ödeme',
            wireDesc: isEn ? 'You will be redirected to your bank\'s portal to complete the transfer instantly.' : 'Anında ödeme için bankanızın internet bankacılığı portalına yönlendirileceksiniz.',
            saveCard: isEn ? 'Your card will be securely saved for recurring payments.' : 'Aylık ödemeler için kartınız güvenli şekilde kaydedilecektir.',
            savedCards: isEn ? 'Your saved cards' : 'Kayıtlı kartlarım',
            newCard: isEn ? 'Pay with a new card' : 'Yeni kart ile öde',
            wireSuccess: isEn ? 'Wire transfer initiated! You are being redirected to your bank.' : 'Havale ödemesi başlatıldı! Bankanıza yönlendiriliyorsunuz.'
        },
        placeholders: {
            email: isEn ? 'example@email.com' : 'ornek@email.com',
            cardName: isEn ? 'FULL NAME' : 'AD SOYAD',
            companyName: isEn ? 'Company legal name' : 'Firma unvanı',
            taxNumber: isEn ? '10 or 11 digits' : '10 veya 11 hane'
        },
        errors: {
            country: isEn ? 'Please select a country.' : 'Lütfen ülke seçin.',
            email: isEn ? 'Please enter a valid email address.' : 'Geçerli bir e-posta girin.',
            privacy: isEn ? 'You must accept the privacy policy to continue.' : 'Devam etmek için gizlilik politikasını onaylamalısınız.',
            companyName: isEn ? 'Company name is required.' : 'İşletme adı zorunludur.',
            taxNumber: isEn ? 'Tax number must be 10 or 11 digits.' : 'Vergi numarası 10 veya 11 haneli olmalıdır.',
            cardName: isEn ? 'Enter the full name on the card.' : 'Kart üzerindeki ad soyad bilgisini girin.',
            cardNumber: isEn ? 'Enter a valid card number.' : 'Geçerli bir kart numarası girin.',
            cardNumberInvalid: isEn ? 'Card number could not be validated. Please check it.' : 'Kart numarası doğrulanamadı. Lütfen kontrol edin.',
            month: isEn ? 'Enter a valid expiry month (01-12).' : 'Geçerli bir son kullanma ayı girin (01-12).',
            year: isEn ? 'Enter a valid expiry year.' : 'Geçerli bir son kullanma yılı girin.',
            expired: isEn ? 'The card appears to be expired.' : 'Kartın son kullanma tarihi geçmiş görünüyor.',
            cvv: isEn ? 'Enter a valid CVV.' : 'Geçerli bir CVV girin.',
            companySave: isEn ? 'Business information could not be saved.' : 'İşletme bilgileri kaydedilemedi.',
            payment: isEn ? 'Payment failed.' : 'Ödeme işlemi başarısız',
            couponMissing: isEn ? 'Please enter a coupon code.' : 'Lütfen bir kupon kodu girin.'
        },
        success: {
            title: isEn ? 'Payment Successful!' : 'Ödeme Başarılı!',
            description: isEn ? 'Your order has been received. Redirecting...' : 'Siparişiniz alındı. Yönlendiriliyorsunuz...'
        }
    }), [isEn]);

    const stepTitle = useMemo(() => {
        if (step === 1) return copy.stepTitles.info;
        if (step === 2) return copy.stepTitles.terms;
        return copy.stepTitles.payment;
    }, [copy.stepTitles.info, copy.stepTitles.payment, copy.stepTitles.terms, step]);

    const baseCurrency = items.length > 0 && items.every((item) => item.currency === items[0].currency) ? items[0].currency : 'TRY';
    const baseTotal = useMemo(() => items.reduce((sum, item) => sum + item.price, 0), [items]);
    const baseSummary = useMemo<CheckoutPricingSummary>(() => ({
        subtotal: baseTotal,
        discount: 0,
        shipping: 0,
        tax: 0,
        total: baseTotal,
        currency: baseCurrency,
        applied_coupon: null
    }), [baseCurrency, baseTotal]);

    useEffect(() => {
        setPricingSummary(baseSummary);
    }, [baseSummary]);

    const formatPrice = (amount: number, currency: string) => {
        const formatted = Number(amount).toLocaleString(isEn ? 'en-US' : 'tr-TR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        return (
            <>
                {formatted} <span className="price-unit">{currency}</span>
            </>
        );
    };

    useEffect(() => {
        if (items.length === 0) {
            navigate(homePath);
        }
    }, [homePath, items, navigate]);

    useEffect(() => {
        if (!user?.email) return;
        setEmail(user.email);
    }, [user?.email]);

    useEffect(() => {
        if (!isAuthenticated) return;
        paymentAPI.getSavedCards()
            .then(res => {
                const list = Array.isArray(res.data?.cards) ? res.data.cards : (Array.isArray(res.data) ? res.data : []);
                setSavedCards(list);
            })
            .catch(() => setSavedCards([]));
    }, [isAuthenticated]);

    // Checkout'a giriş anında sepetteki ürün fiyatlarını backend'den taze çek
    // (admin son dakikada fiyat değiştirmiş olabilir).
    useEffect(() => {
        refreshPrices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Manuel Havale için aktif hesap listesi (Lidio'dan bağımsız, IBAN bazlı)
    // Locale'a göre currency filtresi: TR → TRY hesapları, EN → USD hesapları
    useEffect(() => {
        const desiredCurrency: 'TRY' | 'USD' = isEn ? 'USD' : 'TRY';
        paymentAPI.getManualBankAccounts(desiredCurrency)
            .then(res => {
                const list = Array.isArray(res.data?.accounts) ? res.data.accounts : [];
                setBankAccounts(list as any);
                if (list.length === 1) setSelectedBankId(list[0].id);
            })
            .catch(() => setBankAccounts([]));
    }, [isEn]);

    // Exit intent: 45 saniye hareketsizlikte popup göster (session başına 1 kez)
    useEffect(() => {
        if (success || sessionStorage.getItem('checkout_exit_shown')) return;

        const resetTimer = () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            idleTimerRef.current = setTimeout(() => {
                if (!sessionStorage.getItem('checkout_exit_shown')) {
                    setShowExitIntent(true);
                    sessionStorage.setItem('checkout_exit_shown', '1');
                }
            }, 45000);
        };

        const events = ['mousemove', 'keydown', 'scroll', 'click'];
        events.forEach(ev => window.addEventListener(ev, resetTimer));
        resetTimer();

        return () => {
            events.forEach(ev => window.removeEventListener(ev, resetTimer));
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        };
    }, [success]);

    const handleEmailBlur = () => {
        if (emailEventSentRef.current) return;
        const trimmed = email.trim();
        if (!trimmed || !/\S+@\S+\.\S+/.test(trimmed)) return;
        emailEventSentRef.current = true;
        emailAutomationAPI.logEvent({
            event_type: 'checkout_email_entered',
            email: trimmed,
            cart_data: items.map(i => ({ product_id: i.id, name: i.name, price: i.price, quantity: i.quantity ?? 1 }))
        }).catch(() => {}); // sessiz hata
    };

    const validateStepOne = () => {
        if (!country) {
            setError(copy.errors.country);
            return false;
        }
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            setError(copy.errors.email);
            return false;
        }
        if (!consentState.main_legal) {
            setError(copy.errors.privacy);
            return false;
        }
        // Fatura bilgileri — Türk vergi mevzuatı gereği zorunlu (sadece TR site)
        // EN site'den gelen yabancı müşteriler için TC/vergi no şart değil
        if (!isEn) {
            if (buyingAsBusiness) {
                if (!companyName.trim()) { setError('Şirket ünvanı zorunludur.'); return false; }
                if (!taxOffice.trim()) { setError('Vergi dairesi zorunludur.'); return false; }
                if (!/^\d{10,11}$/.test(taxNumber.trim())) { setError('Vergi numarası 10 veya 11 hane olmalıdır.'); return false; }
            } else {
                const tc = nationalId.replace(/\D/g, '');
                if (tc.length !== 11) { setError('Fatura için 11 haneli TC kimlik numarası zorunludur.'); return false; }
            }
        }
        return true;
    };

    const validateBusinessInfo = () => {
        if (!buyingAsBusiness) return true;
        const vkn = taxNumber.trim();
        if (!companyName.trim()) { setError(copy.errors.companyName); return false; }
        if (!/^\d{10,11}$/.test(vkn)) { setError(copy.errors.taxNumber); return false; }
        return true;
    };

    const validateCardInfo = () => {
        const normalizedNumber = cardNumber.replace(/\D/g, '');
        const normalizedMonth = Number(cardExpireMonth.replace(/\D/g, ''));
        const rawYear = cardExpireYear.replace(/\D/g, '');
        const normalizedYear = rawYear.length === 2 ? Number(`20${rawYear}`) : Number(rawYear);
        const normalizedCvv = cardCvv.replace(/\D/g, '');
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const isLuhnValid = (() => {
            let sum = 0;
            let shouldDouble = false;
            for (let i = normalizedNumber.length - 1; i >= 0; i -= 1) {
                let digit = Number(normalizedNumber[i]);
                if (Number.isNaN(digit)) return false;
                if (shouldDouble) {
                    digit *= 2;
                    if (digit > 9) digit -= 9;
                }
                sum += digit;
                shouldDouble = !shouldDouble;
            }
            return normalizedNumber.length > 0 && sum % 10 === 0;
        })();

        if (!cardHolderName.trim() || cardHolderName.trim().length < 2) {
            setError(copy.errors.cardName);
            return false;
        }
        if (normalizedNumber.length < 12 || normalizedNumber.length > 19) {
            setError(copy.errors.cardNumber);
            return false;
        }
        if (!isLuhnValid) {
            setError(copy.errors.cardNumberInvalid);
            return false;
        }
        if (!Number.isInteger(normalizedMonth) || normalizedMonth < 1 || normalizedMonth > 12) {
            setError(copy.errors.month);
            return false;
        }
        if (!Number.isInteger(normalizedYear) || normalizedYear < currentYear || normalizedYear > currentYear + 20) {
            setError(copy.errors.year);
            return false;
        }
        if (normalizedYear === currentYear && normalizedMonth < currentMonth) {
            setError(copy.errors.expired);
            return false;
        }
        if (!/^\d{3,4}$/.test(normalizedCvv)) {
            setError(copy.errors.cvv);
            return false;
        }

        return true;
    };

    const buildOrderItems = () => items.map((item) => ({
        product_id: item.product_id,
        product_key: item.product_key,
        quantity: 1
    }));

    const handleApplyCoupon = async () => {
        const normalizedCode = couponCode.trim().toUpperCase();
        if (!normalizedCode) {
            setError(copy.errors.couponMissing);
            return;
        }

        setCouponLoading(true);
        setError('');

        try {
            const response = await couponAPI.validate({
                code: normalizedCode,
                items: buildOrderItems(),
                guest_email: email.trim()
            });

            setCouponCode(normalizedCode);
            setPricingSummary(response.data?.pricing as CheckoutPricingSummary);
        } catch (err: any) {
            setPricingSummary(baseSummary);
            setError(err.response?.data?.error || err.message || copy.errors.payment);
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        setCouponCode('');
        setPricingSummary(baseSummary);
    };


    const handleBankTransfer = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        if (!validateBusinessInfo()) return;
        setLoading(true);
        try {
            const orderData = {
                items: buildOrderItems(),
                coupon_code: pricingSummary?.applied_coupon?.code || null,
                customer_type: buyingAsBusiness ? 'company' : 'individual',
                national_id: !buyingAsBusiness ? nationalId : '',
                company_name: buyingAsBusiness ? companyName.trim() : '',
                tax_office: buyingAsBusiness ? taxOffice.trim() : '',
                tax_number: buyingAsBusiness ? taxNumber.trim() : '',
                lang: isEn ? 'en' : 'tr',
                ...(isAuthenticated ? {} : {
                    guest_email: email.trim(),
                    guest_name: email.trim(),
                    guest_phone: ''
                })
            };
            const orderResponse = await ordersAPI.create(orderData);
            const order = orderResponse.data.order;
            const guestAuthToken = orderResponse.data.auth_token;
            if (guestAuthToken) await activateToken(guestAuthToken);

            // MANUEL HAVALE — Lidio'dan bağımsız, IBAN gösterip pending durumda bırakır.
            // Admin para gelince admin paneldeki "Confirm Payment" ile completed yapar.
            const result = await paymentAPI.manualTransfer({
                order_id: order.id,
                manual_bank_account_id: selectedBankId || undefined
            });
            setWireTransferResult(result.data);
            clearCart();

            // Yönlendirme: önce şifre belirle (gerekiyorsa), sonra hesabım sayfasına
            if (user?.must_change_password) {
                setTimeout(() => navigate(isEn ? '/en/set-password' : '/sifre-belirle'), 2500);
            } else {
                // 6 saniye sonra hesabım sayfasına geç — kullanıcı IBAN'ı not alabilsin diye yeterli süre
                setTimeout(() => navigate(`${dashboardPath}?tab=orders`, { replace: true }), 6000);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || copy.errors.payment);
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateBusinessInfo()) return;
        const usingSavedCard = selectedCardId > 0;
        if (!useHostedPayment && !usingSavedCard && !validateCardInfo()) return;
        setLoading(true);

        try {
            // Create order
            const guestNameFromCard = cardHolderName.trim() || '';
            const orderData = {
                items: buildOrderItems(),
                coupon_code: pricingSummary?.applied_coupon?.code || null,
                customer_type: buyingAsBusiness ? 'company' : 'individual',
                national_id: !buyingAsBusiness ? nationalId : '',
                company_name: buyingAsBusiness ? companyName.trim() : '',
                tax_office: buyingAsBusiness ? taxOffice.trim() : '',
                tax_number: buyingAsBusiness ? taxNumber.trim() : '',
                ...(isAuthenticated ? {} : {
                    guest_email: email.trim(),
                    guest_name: guestNameFromCard,
                    guest_phone: ''
                })
            };

            const orderResponse = await ordersAPI.create(orderData);
            const order = orderResponse.data.order;
            const guestAuthToken = orderResponse.data.auth_token;
            const activeToken = guestAuthToken || localStorage.getItem('token');
            const paymentRequired = orderResponse.data.payment_required !== false;

            if (guestAuthToken) {
                await activateToken(guestAuthToken);
            }

            if (buyingAsBusiness && activeToken) {
                const companyRes = await fetch(`${API_BASE}/company`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${activeToken}`
                    },
                    body: JSON.stringify({
                        company_name: companyName.trim(),
                        tax_number: taxNumber.trim(),
                        company_address: `${country} - İşletme Satın Alımı`,
                        company_phone: ''
                    })
                });

                if (!companyRes.ok) {
                    throw new Error(copy.errors.companySave);
                }
            }

            // Free order (e.g. 100% discount coupon): skip payment gateway
            if (!paymentRequired) {
                setSuccess(true);
                const needsOnboarding = items.some(i => i.category === 'hizmetler' || i.category === 'sektorler');
                clearCart();
                setTimeout(() => {
                    if (user?.must_change_password) {
                        navigate(isEn ? '/en/set-password' : '/sifre-belirle');
                    } else if (needsOnboarding) {
                        navigate(`${onboardingFormPath}?order_id=${order.id}`);
                    } else {
                        navigate(`${dashboardPath}?tab=orders&success=true`);
                    }
                }, 1500);
                return;
            }

            // Initiate payment
            const paymentPayload: Record<string, any> = {
                order_id: order.id,
                use_3ds: true,
                use_hosted: useHostedPayment
            };

            if (selectedCardId > 0) {
                paymentPayload.saved_card_id = selectedCardId;
            } else if (!useHostedPayment) {
                paymentPayload.card_number = cardNumber.replace(/\D/g, '');
                paymentPayload.card_holder_name = cardHolderName.trim();
                paymentPayload.card_expire_month = Number(cardExpireMonth.replace(/\D/g, ''));
                paymentPayload.card_expire_year = (() => {
                    const year = cardExpireYear.replace(/\D/g, '');
                    return Number(year.length === 2 ? `20${year}` : year);
                })();
                paymentPayload.card_cvv = cardCvv.replace(/\D/g, '');
                if (hasSubscription) paymentPayload.save_card = true;
            }

            const paymentResponse = await paymentAPI.initiate(paymentPayload);

            const payment = paymentResponse.data.payment || {};
            const redirectUrl =
                payment.redirectUrl ||
                payment.redirect_url ||
                payment.threeDSUrl ||
                payment.three_ds_url ||
                payment.paymentPageUrl ||
                payment.payment_page_url ||
                payment.url;

            if (redirectUrl) {
                try {
                    const parsed = new URL(String(redirectUrl));
                    const host = parsed.hostname.toLowerCase();
                    const isInvalidUatHost =
                        host.includes('lancldnp.yapikredi.com.tr') ||
                        host.includes('ykbacs.posmerchant.ui');
                    if (isInvalidUatHost) {
                        throw new Error(
                            'POS ayarı TEST/UAT 3D doğrulama domainine yönlendiriyor. Canlı satış için admin panelinden production POS bilgilerini (lidio_test_mode=false ve production anahtarları) girmeniz gerekir.'
                        );
                    }
                } catch (urlErr: any) {
                    if (urlErr?.message) {
                        throw urlErr;
                    }
                }
                window.location.href = String(redirectUrl);
                return;
            }

            if (payment.redirectForm) {
                document.open();
                document.write(String(payment.redirectForm));
                document.close();
                return;
            }

            if (payment.redirectFormParams && typeof payment.redirectFormParams === 'object') {
                const formParams = payment.redirectFormParams as Record<string, any>;
                const action = formParams.action || formParams.url || formParams.redirectUrl;
                const method = String(formParams.method || 'POST').toUpperCase();
                const fields = formParams.params || formParams.formFields || formParams.fields || formParams.data || {};
                if (action) {
                    const form = document.createElement('form');
                    form.method = method === 'GET' ? 'GET' : 'POST';
                    form.action = String(action);
                    form.style.display = 'none';
                    Object.entries(fields).forEach(([key, value]) => {
                        const input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = key;
                        input.value = String(value ?? '');
                        form.appendChild(input);
                    });
                    document.body.appendChild(form);
                    form.submit();
                    return;
                }
            }

            if (payment.success) {
                setSuccess(true);
                const needsOnboarding = items.some(i => i.category === 'hizmetler' || i.category === 'sektorler');
                clearCart();

                setTimeout(() => {
                    if (user?.must_change_password) {
                        navigate(isEn ? '/en/set-password' : '/sifre-belirle');
                    } else if (needsOnboarding) {
                        navigate(`${onboardingFormPath}?order_id=${order.id}`);
                    } else {
                        navigate(`${dashboardPath}?tab=orders&success=true`);
                    }
                }, 1500);
            } else {
                throw new Error(
                    payment.resultMessage ||
                    payment.message ||
                    payment.resultDetail ||
                    payment.status ||
                    'Payment failed'
                );
            }
        } catch (err: any) {
            console.error('Checkout error:', err);
            setError(err.response?.data?.error || err.message || copy.errors.payment);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="checkout-page">
                <div className="checkout-container">
                    <div className="success-message">
                        <HiCheckCircle className="success-icon" />
                        <h2>{copy.success.title}</h2>
                        <p>{copy.success.description}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
        <div className="checkout-page">
            <div className="checkout-container">
                <h1>{stepTitle}</h1>

                <div className="checkout-steps">
                    <div className={`checkout-step ${step >= 1 ? 'active' : ''}`}>1. {copy.steps.info}</div>
                    <div className={`checkout-step ${step >= 2 ? 'active' : ''}`}>2. {copy.steps.terms}</div>
                    <div className={`checkout-step ${step >= 3 ? 'active' : ''}`}>3. {copy.steps.payment}</div>
                </div>

                {error && <div className="checkout-error">{error}</div>}

                {step === 1 && (
                    <div className="checkout-card">
                        <div className="step-intro">
                            <h2>{copy.intro.infoTitle}</h2>
                            <p>{copy.intro.infoDescription}</p>
                        </div>

                        <div className="field-grid">
                            <div className="form-group">
                                <label>{copy.fields.country}</label>
                                <select className="form-control" value={country} onChange={(e) => setCountry(e.target.value)}>
                                    <option>Türkiye</option>
                                    <option>Almanya</option>
                                    <option>Hollanda</option>
                                    <option>İngiltere</option>
                                    <option>Amerika Birleşik Devletleri</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>{copy.fields.email}</label>
                                <input
                                    className="form-control"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onBlur={handleEmailBlur}
                                    placeholder={copy.placeholders.email}
                                />
                            </div>
                        </div>

                        {/* Fatura bilgileri — sadece TR site'de zorunlu (yabancı müşteri EN'de istenmez) */}
                        {!isEn && (
                        <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: '#1a3a52' }}>
                                {isEn ? 'Billing Information' : 'Fatura Bilgileri'}
                            </h3>
                            <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="customer_type"
                                        checked={!buyingAsBusiness}
                                        onChange={() => setBuyingAsBusiness(false)}
                                    />
                                    {isEn ? 'Individual' : 'Bireysel'}
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="customer_type"
                                        checked={buyingAsBusiness}
                                        onChange={() => setBuyingAsBusiness(true)}
                                    />
                                    {isEn ? 'Company' : 'Kurumsal'}
                                </label>
                            </div>

                            {!buyingAsBusiness ? (
                                <div className="form-group">
                                    <label>{isEn ? 'National ID (TC)' : 'TC Kimlik Numarası'}</label>
                                    <input
                                        className="form-control"
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={11}
                                        value={nationalId}
                                        onChange={(e) => setNationalId(e.target.value.replace(/\D/g, '').slice(0, 11))}
                                        placeholder={isEn ? '11 digits' : '11 hane'}
                                    />
                                </div>
                            ) : (
                                <div className="field-grid">
                                    <div className="form-group">
                                        <label>{isEn ? 'Company Name' : 'Şirket Ünvanı'}</label>
                                        <input
                                            className="form-control"
                                            type="text"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            placeholder={isEn ? 'Company legal name' : 'Firma unvanı'}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{isEn ? 'Tax Office' : 'Vergi Dairesi'}</label>
                                        <input
                                            className="form-control"
                                            type="text"
                                            value={taxOffice}
                                            onChange={(e) => setTaxOffice(e.target.value)}
                                            placeholder={isEn ? 'e.g. Beşiktaş' : 'Örn. Beşiktaş'}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{isEn ? 'Tax Number (VKN)' : 'Vergi Numarası (VKN)'}</label>
                                        <input
                                            className="form-control"
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={11}
                                            value={taxNumber}
                                            onChange={(e) => setTaxNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                                            placeholder={isEn ? '10 or 11 digits' : '10 veya 11 hane'}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        )}

                        {/* 4-katmanlı SaaS standardı onay komponenti — Bilgiler adımında.
                            (Terms+Privacy+Refund tek main_legal'da; ETK opsiyonel; B2B + auto-renewal koşullu) */}
                        <div className="policy-checkboxes">
                            <ConsentCheckboxes
                                context="checkout"
                                isEn={isEn}
                                showB2B={buyingAsBusiness}
                                showAutoRenewal={hasSubscription}
                                onChange={setConsentState}
                                initial={consentState}
                            />
                        </div>

                        <div className="actions-row">
                            <button
                                type="button"
                                className="btn-next"
                                onClick={() => {
                                    setError('');
                                    if (!validateStepOne()) return;
                                    setStep(2);
                                }}
                            >
                                {copy.buttons.continue}
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (() => {
                    const policies: Array<{ key: string; slugKey: string; tr: string; en: string }> = [
                        { key: 'termsOfService', slugKey: 'termsOfService', tr: 'Hizmet Şartları', en: 'Terms of Service' },
                        { key: 'privacyPolicy', slugKey: 'privacyPolicy', tr: 'Gizlilik Politikası', en: 'Privacy Policy' },
                        { key: 'cookiePolicy', slugKey: 'cookiePolicy', tr: 'Çerez Politikası', en: 'Cookie Policy' },
                        { key: 'refundPolicy', slugKey: 'refundPolicy', tr: 'İade ve İptal Politikası', en: 'Cancellation & Refund Policy' },
                        { key: 'distanceSale', slugKey: 'distanceSale', tr: 'Mesafeli Satış Sözleşmesi', en: 'Distance Sales Agreement' },
                        { key: 'preInformation', slugKey: 'preInformation', tr: 'Ön Bilgilendirme Formu', en: 'Pre-Purchase Information Notice' },
                        { key: 'acceptableUse', slugKey: 'acceptableUse', tr: 'Kullanım Koşulları', en: 'Terms of Use & Acceptable Use' },
                    ];
                    const allChecked = policies.every(p => policyChecks[p.key]);
                    const toggle = (k: string) => setPolicyChecks(prev => ({ ...prev, [k]: !prev[k] }));
                    const approveAll = () => {
                        const next: Record<string, boolean> = {};
                        for (const p of policies) next[p.key] = true;
                        setPolicyChecks(next);
                    };
                    return (
                    <div className="checkout-card">
                        <div className="step-intro">
                            <h2>{isEn ? 'Review and Approve the Agreements' : 'Sözleşmeleri İnceleyin ve Onaylayın'}</h2>
                            <p>{isEn
                                ? 'Please approve each agreement individually below. To read the full text, click the title — it will open in a new tab.'
                                : 'Aşağıdaki her sözleşmeyi ayrı ayrı onaylayın. Tam metni okumak için başlığa tıklayın; yeni sekmede açılır.'}</p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                            <button
                                type="button"
                                onClick={approveAll}
                                style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                            >
                                {isEn ? '✓ Approve All' : '✓ Tümünü Onayla'}
                            </button>
                        </div>

                        <div className="policy-list" style={{ display: 'grid', gap: 10 }}>
                            {policies.map((p) => {
                                const href = getLocalizedPathByKey(currentLang, p.slugKey);
                                const label = isEn ? p.en : p.tr;
                                const acceptText = isEn ? 'I have read and accept' : 'Okudum, kabul ediyorum';
                                return (
                                    <label key={p.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 10, background: policyChecks[p.key] ? '#f0fdf4' : '#fff', cursor: 'pointer', transition: 'background 0.15s' }}>
                                        <input
                                            type="checkbox"
                                            checked={!!policyChecks[p.key]}
                                            onChange={() => toggle(p.key)}
                                            style={{ width: 16, height: 16, marginTop: 2, flexShrink: 0 }}
                                        />
                                        <span style={{ fontSize: 14, lineHeight: 1.45, color: '#0f172a' }}>
                                            <a href={href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 600 }}>
                                                {label}
                                            </a>
                                            <span style={{ color: '#475569', marginLeft: 6 }}>— {acceptText}</span>
                                        </span>
                                    </label>
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            className="btn-next"
                            disabled={!allChecked || !allPoliciesAccepted}
                            onClick={() => setStep(3)}
                            style={{ marginTop: 16 }}
                        >
                            {copy.buttons.acceptTerms}
                        </button>
                    </div>
                    );
                })()}

                {step === 3 && hasMaestroItem && (
                    <div style={{
                        maxWidth: 720, margin: '2rem auto', background: '#fff',
                        border: '1px solid #e2e8f0', borderRadius: 12, padding: '2rem',
                        textAlign: 'center', boxShadow: '0 8px 24px rgba(15,23,42,0.06)'
                    }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🛠️</div>
                        <h2 style={{ margin: '0 0 0.75rem', color: '#1a3a52', fontSize: '1.35rem' }}>
                            {isEn ? 'Coming soon' : 'Çok yakında'}
                        </h2>
                        <p style={{ color: '#475569', lineHeight: 1.7, fontSize: '1rem', marginBottom: '1.5rem' }}>
                            {isEn
                                ? 'Our sector-specific Maestro AI service is still under development and will be available very soon.'
                                : 'Sektörünüze özel Maestro AI hizmetimiz için geliştirme çalışmalarımız devam etmekte olup çok yakında kullanıma açılacaktır.'}
                            <br />
                            {isEn ? 'For details: ' : 'Detaylı bilgi için: '}
                            <a href="mailto:info@khilonfast.com" style={{ color: '#89b004', fontWeight: 700, textDecoration: 'none' }}>
                                info@khilonfast.com
                            </a>
                        </p>
                        <button
                            type="button"
                            className="btn-next"
                            onClick={() => navigate(homePath)}
                        >
                            {isEn ? 'Back to homepage' : 'Anasayfaya Dön'}
                        </button>
                    </div>
                )}

                {step === 3 && !hasMaestroItem && (
                    <div className="checkout-grid">
                        {/* Order Summary */}
                        <div className="order-summary">
                            <h2>
                                <HiShoppingBag /> {copy.summary.title}
                            </h2>

                            <div className="coupon-box">
                                <label htmlFor="couponCode">{copy.summary.couponLabel}</label>
                                <div className="coupon-row">
                                    <input
                                        id="couponCode"
                                        className="form-control"
                                        type="text"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        placeholder={isEn ? 'Enter coupon code' : 'Kupon kodunu girin'}
                                        disabled={couponLoading}
                                    />
                                    <button
                                        type="button"
                                        className="btn-next coupon-apply-btn"
                                        onClick={handleApplyCoupon}
                                        disabled={couponLoading || items.length === 0}
                                    >
                                        {couponLoading ? copy.summary.applying : copy.summary.apply}
                                    </button>
                                </div>
                                {pricingSummary?.applied_coupon && (
                                    <div className="coupon-applied">
                                        <div>
                                            <strong>{copy.summary.couponApplied}:</strong>{' '}
                                            <code>{pricingSummary.applied_coupon.code}</code>
                                            <span> {pricingSummary.applied_coupon.name}</span>
                                        </div>
                                        <button type="button" className="coupon-remove-btn" onClick={handleRemoveCoupon}>
                                            {copy.summary.remove}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="summary-items">
                                {items.map((item) => (
                                    <div key={item.id} className="summary-item">
                                        <div>
                                            <h3>{item.name}</h3>
                                        </div>
                                        <div className="item-price">
                                            {formatPrice(item.price, item.currency)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="summary-breakdown">
                                <div className="summary-line">
                                    <span>{copy.summary.subtotal}</span>
                                    <strong>{formatPrice(pricingSummary?.subtotal ?? baseSummary.subtotal, pricingSummary?.currency ?? baseSummary.currency)}</strong>
                                </div>
                                <div className="summary-line summary-line-discount">
                                    <span>{copy.summary.discount}</span>
                                    <strong>- {formatPrice(pricingSummary?.discount ?? 0, pricingSummary?.currency ?? baseSummary.currency)}</strong>
                                </div>
                                <div className="summary-line">
                                    <span>{copy.summary.shipping}</span>
                                    <strong>{formatPrice(pricingSummary?.shipping ?? 0, pricingSummary?.currency ?? baseSummary.currency)}</strong>
                                </div>
                                <div className="summary-line">
                                    <span>{copy.summary.tax}</span>
                                    <strong>{formatPrice(pricingSummary?.tax ?? 0, pricingSummary?.currency ?? baseSummary.currency)}</strong>
                                </div>
                            </div>

                            <div className="summary-total">
                                <span>{copy.summary.total}</span>
                                <strong>{formatPrice(pricingSummary?.total ?? baseSummary.total, pricingSummary?.currency ?? baseSummary.currency)}</strong>
                            </div>

                            {items.some(i => (i.original_currency || '').toUpperCase() === 'USD') && (
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', marginTop: 8, padding: '8px 4px 0', borderTop: '1px solid rgba(0,0,0,0.05)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {isEn ? 'Rate:' : 'Kur:'}
                                    {(() => {
                                        const usdItem = items.find(i => i.usd_try_rate);
                                        return usdItem?.usd_try_rate
                                            ? ` 1 USD = ${Number(usdItem.usd_try_rate).toFixed(4)} TL · `
                                            : ' ';
                                    })()}
                                    <a
                                        href="https://www.tcmb.gov.tr/kurlar/today.xml"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={isEn ? 'Central Bank of Turkey — daily official rate' : 'Türkiye Cumhuriyet Merkez Bankası — resmi günlük kur'}
                                        style={{ color: '#64748b', textDecoration: 'underline' }}
                                    >
                                        TCMB
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Payment Form */}
                        <div className="payment-section">
                            <h2>
                                <HiCreditCard /> {copy.payment.title}
                            </h2>

                            {/* Ödeme Yöntemi Sekmeleri — Anında Havale sadece banka tanımlıysa görünür.
                                Lidio canlı ortamda DirectWireTransfer henüz aktif olmadığı için banka eklenmedikçe gizli. */}
                            <div className="payment-tabs">
                                {/* EN locale + bank-only mode'da kart sekmesi gizli — sadece banka havalesi gösterilir */}
                                {!enBankOnly && (
                                    <button
                                        type="button"
                                        className={`payment-tab${paymentMethod === 'card' ? ' active' : ''}`}
                                        onClick={() => setPaymentMethod('card')}
                                    >
                                        <HiCreditCard /> {copy.payment.tabCard}
                                    </button>
                                )}
                                {bankAccounts.length > 0 && (
                                    <button
                                        type="button"
                                        className={`payment-tab${paymentMethod === 'wire_transfer' ? ' active' : ''}`}
                                        onClick={() => setPaymentMethod('wire_transfer')}
                                    >
                                        <HiLibrary /> {copy.payment.tabWire}
                                    </button>
                                )}
                            </div>

                            {paymentMethod === 'wire_transfer' ? (
                                <>
                                    {wireTransferResult ? (
                                        <div className="wire-transfer-success">
                                            <HiCheckCircle style={{ fontSize: '2rem', color: '#22c55e' }} />
                                            <p>{copy.payment.wireSuccess}</p>
                                        </div>
                                    ) : (
                                        <div className="payment-method-box" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                <HiLibrary style={{ fontSize: '1.5rem', color: '#2563eb' }} />
                                                <strong>{isEn ? 'Pay by Wire Transfer' : 'Havale ile Ödeme'}</strong>
                                            </div>
                                            <p style={{ margin: '0.5rem 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
                                                {copy.payment.wireDesc}
                                            </p>

                                            {bankAccounts.length === 0 && (
                                                <p style={{ margin: '0.75rem 0 0', color: '#dc2626', fontSize: '0.85rem' }}>
                                                    {isEn
                                                        ? 'No bank accounts available right now. Please contact us at info@khilonfast.com.'
                                                        : 'Şu anda manuel havale hesabı tanımlı değil. info@khilonfast.com ile iletişime geçin.'}
                                                </p>
                                            )}

                                            {/* Seçili (veya tek) hesabın IBAN bilgileri — kullanıcı transferi yapacağı bilgileri görür */}
                                            {(() => {
                                                const sel = bankAccounts.find(b => b.id === selectedBankId) || (bankAccounts.length === 1 ? bankAccounts[0] : null);
                                                if (!sel || !sel.iban) return null;
                                                return (
                                                    <div style={{ marginTop: '1rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, padding: '14px 16px', fontSize: '0.9rem' }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '6px 12px' }}>
                                                            <strong>{isEn ? 'Bank' : 'Banka'}:</strong>
                                                            <span>{sel.bank_name}</span>
                                                            {sel.account_holder && <>
                                                                <strong>{isEn ? 'Account' : 'Hesap'}:</strong>
                                                                <span>{sel.account_holder}</span>
                                                            </>}
                                                            <strong>IBAN:</strong>
                                                            <span style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{sel.iban}</span>
                                                            {sel.swift && <>
                                                                <strong>SWIFT:</strong>
                                                                <span style={{ fontFamily: 'monospace' }}>{sel.swift}</span>
                                                            </>}
                                                            {sel.currency && <>
                                                                <strong>{isEn ? 'Currency' : 'Para birimi'}:</strong>
                                                                <span>{sel.currency}</span>
                                                            </>}
                                                        </div>
                                                        <p style={{ margin: '10px 0 0', color: '#64748b', fontSize: '0.82rem' }}>
                                                            {isEn
                                                                ? 'Use your order number as the transfer description. Your order will be activated once payment is received.'
                                                                : 'Açıklama kısmına sipariş numaranızı yazın. Ödemeniz alındığında siparişiniz aktif edilecek.'}
                                                        </p>
                                                    </div>
                                                );
                                            })()}

                                            {bankAccounts.length > 1 && (
                                                <div style={{ marginTop: '1rem', width: '100%', display: 'grid', gap: '0.5rem' }}>
                                                    <label style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>
                                                        {isEn ? 'Select your bank' : 'Bankanızı seçin'}
                                                    </label>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
                                                        {bankAccounts.map(bank => (
                                                            <button
                                                                key={bank.id}
                                                                type="button"
                                                                onClick={() => setSelectedBankId(bank.id)}
                                                                style={{
                                                                    padding: '0.75rem',
                                                                    border: `2px solid ${selectedBankId === bank.id ? '#2563eb' : '#e5e7eb'}`,
                                                                    borderRadius: '8px',
                                                                    background: selectedBankId === bank.id ? '#eff6ff' : '#fff',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    gap: '0.5rem',
                                                                    fontSize: '0.85rem'
                                                                }}
                                                            >
                                                                {bank.logo_url && <img src={bank.logo_url} alt={bank.bank_name} width={80} height={24} loading="lazy" decoding="async" style={{ height: '24px', width: 'auto' }} />}
                                                                <span>{bank.bank_name}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <label className="checkbox-row business-buying">
                                        <input type="checkbox" checked={buyingAsBusiness} onChange={(e) => setBuyingAsBusiness(e.target.checked)} />
                                        <span>{copy.fields.businessPurchase}</span>
                                    </label>
                                    {buyingAsBusiness && (
                                        <div className="field-grid">
                                            <div className="form-group">
                                                <label>{copy.fields.companyName}</label>
                                                <input className="form-control" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder={copy.placeholders.companyName} />
                                            </div>
                                            <div className="form-group">
                                                <label>{copy.fields.taxNumber}</label>
                                                <input className="form-control" value={taxNumber} onChange={(e) => setTaxNumber(e.target.value.replace(/\D/g, ''))} placeholder={copy.placeholders.taxNumber} maxLength={11} />
                                            </div>
                                        </div>
                                    )}

                                    {!wireTransferResult && (
                                        <form onSubmit={handleBankTransfer} className="payment-form">
                                            <button
                                                type="submit"
                                                className="btn-pay"
                                                disabled={loading || bankAccounts.length === 0 || (bankAccounts.length > 1 && !selectedBankId)}
                                            >
                                                {loading ? copy.buttons.processing : (isEn ? 'Place Order (Wire Transfer)' : 'Siparişi Ver (Havale)')}
                                            </button>
                                        </form>
                                    )}

                                    {wireTransferResult && (
                                        <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 12, padding: '20px 24px', marginTop: '1rem' }}>
                                            <h3 style={{ margin: '0 0 8px', color: '#166534' }}>
                                                {isEn ? '✓ Order Created — Awaiting Payment' : '✓ Siparişiniz Oluşturuldu — Ödeme Bekleniyor'}
                                            </h3>
                                            <p style={{ margin: '0 0 8px', color: '#14532d' }}>
                                                {isEn
                                                    ? `Your order ${wireTransferResult.order?.order_number || ''} is awaiting payment confirmation. Please complete the bank transfer using the IBAN above.`
                                                    : `Sipariş numaranız ${wireTransferResult.order?.order_number || ''}. Lütfen yukarıdaki IBAN'a transfer yapın.`}
                                            </p>
                                            <p style={{ margin: 0, color: '#14532d', fontSize: '0.9rem' }}>
                                                {isEn
                                                    ? 'You will receive an email confirmation when payment is received and your order is activated.'
                                                    : 'Ödemeniz alındığında siparişiniz aktive edilecek ve size mail gönderilecek.'}
                                            </p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {/* Kayıtlı Kartlar */}
                                    {isAuthenticated && savedCards.length > 0 && (
                                        <div className="saved-cards-section">
                                            <label className="saved-cards-label">{copy.payment.savedCards}</label>
                                            <div className="saved-cards-list">
                                                {savedCards.map(card => (
                                                    <label key={card.id} className={`saved-card-item${selectedCardId === card.id ? ' selected' : ''}`}>
                                                        <input
                                                            type="radio"
                                                            name="savedCard"
                                                            value={card.id}
                                                            checked={selectedCardId === card.id}
                                                            onChange={() => setSelectedCardId(card.id)}
                                                        />
                                                        <HiCreditCard />
                                                        <span>{card.masked_number}</span>
                                                        {card.card_brand && <span className="card-brand">{card.card_brand}</span>}
                                                        <span className="card-expire">{String(card.expire_month).padStart(2,'0')}/{card.expire_year}</span>
                                                    </label>
                                                ))}
                                                <label className={`saved-card-item${selectedCardId === 0 ? ' selected' : ''}`}>
                                                    <input
                                                        type="radio"
                                                        name="savedCard"
                                                        value={0}
                                                        checked={selectedCardId === 0}
                                                        onChange={() => setSelectedCardId(0)}
                                                    />
                                                    <HiCreditCard />
                                                    <span>{copy.payment.newCard}</span>
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    {/* Yeni Kart Formu */}
                                    {selectedCardId === 0 && !useHostedPayment && (
                                        <div className="field-grid">
                                            <div className="form-group">
                                                <label>{copy.fields.cardName}</label>
                                                <input className="form-control" value={cardHolderName} onChange={(e) => setCardHolderName(e.target.value)} placeholder={copy.placeholders.cardName} autoComplete="cc-name" />
                                            </div>
                                            <div className="form-group">
                                                <label>{copy.fields.cardNumber}</label>
                                                <input className="form-control" value={cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ')} onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 19))} placeholder="0000 0000 0000 0000" inputMode="numeric" autoComplete="cc-number" />
                                            </div>
                                            <div className="form-group">
                                                <label>{copy.fields.expireMonth}</label>
                                                <input className="form-control" value={cardExpireMonth} onChange={(e) => setCardExpireMonth(e.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="AA" inputMode="numeric" autoComplete="cc-exp-month" />
                                            </div>
                                            <div className="form-group">
                                                <label>{copy.fields.expireYear}</label>
                                                <input className="form-control" value={cardExpireYear} onChange={(e) => setCardExpireYear(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="YYYY" inputMode="numeric" autoComplete="cc-exp-year" />
                                            </div>
                                            <div className="form-group">
                                                <label>CVV</label>
                                                <input className="form-control" type="password" value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="123" inputMode="numeric" autoComplete="cc-csc" />
                                            </div>
                                            {hasSubscription && (
                                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                                    <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                        <HiShieldCheck style={{ flexShrink: 0 }} />
                                                        {copy.payment.saveCard}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <label className="checkbox-row business-buying">
                                        <input type="checkbox" checked={buyingAsBusiness} onChange={(e) => setBuyingAsBusiness(e.target.checked)} />
                                        <span>{copy.fields.businessPurchase}</span>
                                    </label>
                                    {buyingAsBusiness && (
                                        <div className="field-grid">
                                            <div className="form-group">
                                                <label>{copy.fields.companyName}</label>
                                                <input className="form-control" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder={copy.placeholders.companyName} />
                                            </div>
                                            <div className="form-group">
                                                <label>{copy.fields.taxNumber}</label>
                                                <input className="form-control" value={taxNumber} onChange={(e) => setTaxNumber(e.target.value.replace(/\D/g, ''))} placeholder={copy.placeholders.taxNumber} maxLength={11} />
                                            </div>
                                        </div>
                                    )}

                                    <form onSubmit={handlePayment} className="payment-form">
                                        <button type="submit" className="btn-pay" disabled={loading}>
                                            {loading ? copy.buttons.processing : buyingAsBusiness ? copy.buttons.completePayment : copy.buttons.buyAndPay}
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Exit Intent Popup */}
        {showExitIntent && (
            <div style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
            }}>
                <div style={{
                    background: '#fff', borderRadius: '12px', padding: '2rem', maxWidth: '440px', width: '100%',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.18)', position: 'relative'
                }}>
                    <button
                        onClick={() => setShowExitIntent(false)}
                        style={{
                            position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'none',
                            border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#94a3b8', lineHeight: 1
                        }}
                        aria-label="Kapat"
                    >×</button>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💬</div>
                        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.3rem', color: '#1a3a52' }}>
                            {isEn ? 'Need support?' : 'Desteğe mi ihtiyacınız var?'}
                        </h2>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                            {isEn
                                ? 'We can help you right away!'
                                : 'Size hemen yardımcı olabiliriz!'}
                        </p>
                        <a
                            href="https://wa.me/905551234567"
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                display: 'inline-block', background: '#25d366', color: '#fff',
                                padding: '0.75rem 1.75rem', borderRadius: '8px', fontWeight: 700,
                                textDecoration: 'none', fontSize: '1rem'
                            }}
                            onClick={() => setShowExitIntent(false)}
                        >
                            {isEn ? 'Chat on WhatsApp' : "WhatsApp'tan Yaz"}
                        </a>
                        <div style={{ marginTop: '1rem' }}>
                            <button
                                onClick={() => setShowExitIntent(false)}
                                style={{
                                    background: 'none', border: 'none', color: '#94a3b8',
                                    cursor: 'pointer', fontSize: '0.875rem', textDecoration: 'underline'
                                }}
                            >
                                {isEn ? 'Continue checkout' : 'Ödemeye devam et'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
