import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ordersAPI, paymentAPI } from '../services/api';
import { HiCheckCircle, HiCreditCard, HiShieldCheck, HiShoppingBag } from 'react-icons/hi';
import './Checkout.css';
import { getLocalizedPathByKey, useRouteLocale } from '../utils/locale';
import { API_BASE_URL } from '../config/api';

export default function Checkout() {
    useTranslation('common');
    const useHostedPayment = false;
    const API_BASE = API_BASE_URL;
    const { user, isAuthenticated, activateToken } = useAuth();
    const { items, getTotalPrice, clearCart } = useCart();
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as { email?: string; name?: string; country?: string } | null;
    const currentLang = useRouteLocale();
    const isEn = currentLang === 'en';
    const homePath = getLocalizedPathByKey(currentLang, 'home');
    const dashboardPath = getLocalizedPathByKey(currentLang, 'dashboard');
    const termsContentRef = useRef<HTMLDivElement | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    
    // Auto-advance logic: if coming with guest info, start at Step 3 (Payment)
    const [step, setStep] = useState<1 | 2 | 3>(state?.email ? 3 : 1);
    const [termsReachedEnd, setTermsReachedEnd] = useState(state?.email ? true : false);
    const [termsAccepted, setTermsAccepted] = useState(state?.email ? true : false);
    const [privacyAccepted, setPrivacyAccepted] = useState(state?.email ? true : false);
    const [country, setCountry] = useState(state?.country || 'Türkiye');
    const [email, setEmail] = useState(state?.email || user?.email || '');
    const [buyingAsBusiness, setBuyingAsBusiness] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [taxNumber, setTaxNumber] = useState('');
    const [cardHolderName, setCardHolderName] = useState(state?.name || '');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpireMonth, setCardExpireMonth] = useState('');
    const [cardExpireYear, setCardExpireYear] = useState('');
    const [cardCvv, setCardCvv] = useState('');
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
            total: isEn ? 'Total:' : 'Toplam:'
        },
        payment: {
            title: isEn ? 'Payment Method' : 'Ödeme Yöntemi',
            providerTitle: isEn ? 'Lidio Virtual POS' : 'Lidio Sanal POS',
            providerDescription: isEn ? 'Your payment will be completed through secure payment infrastructure.' : 'Ödemeniz güvenli ödeme altyapısı üzerinden tamamlanacaktır.',
            hostedTitle: isEn ? 'Card details will be entered on the Lidio screen' : 'Kart bilgisi Lidio ekranında girilecek',
            hostedDescription: isEn ? 'After clicking the buy button, you will be redirected to the secure Lidio payment page.' : 'Satın al butonundan sonra güvenli Lidio ödeme sayfasına yönlendirileceksiniz.'
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
            payment: isEn ? 'Payment failed.' : 'Ödeme işlemi başarısız'
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

    const validateStepOne = () => {
        if (!country) {
            setError(copy.errors.country);
            return false;
        }
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            setError(copy.errors.email);
            return false;
        }
        if (!privacyAccepted) {
            setError(copy.errors.privacy);
            return false;
        }
        return true;
    };

    const validateBusinessInfo = () => {
        if (!buyingAsBusiness) return true;

        const vkn = taxNumber.trim();
        if (!companyName.trim()) {
            setError(copy.errors.companyName);
            return false;
        }
        if (!/^\d{10,11}$/.test(vkn)) {
            setError(copy.errors.taxNumber);
            return false;
        }
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

    const handleTermsScroll = () => {
        if (!termsContentRef.current) return;
        const el = termsContentRef.current;
        const reached = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
        if (reached) setTermsReachedEnd(true);
    };

    const handlePayment = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateBusinessInfo()) return;
        if (!useHostedPayment && !validateCardInfo()) return;
        setLoading(true);

        try {
            // Create order
            const guestNameFromCard = cardHolderName.trim() || '';
            const orderData = {
                items: items.map(item => ({
                    product_id: item.product_id,
                    product_key: item.product_key,
                    quantity: 1
                })),
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

            // Initiate payment (using test mode for now)
            const paymentPayload: Record<string, any> = {
                order_id: order.id,
                use_3ds: true,
                use_hosted: useHostedPayment
            };

            if (!useHostedPayment) {
                paymentPayload.card_number = cardNumber.replace(/\D/g, '');
                paymentPayload.card_holder_name = cardHolderName.trim();
                paymentPayload.card_expire_month = Number(cardExpireMonth.replace(/\D/g, ''));
                paymentPayload.card_expire_year = (() => {
                    const year = cardExpireYear.replace(/\D/g, '');
                    return Number(year.length === 2 ? `20${year}` : year);
                })();
                paymentPayload.card_cvv = cardCvv.replace(/\D/g, '');
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
                clearCart();

                setTimeout(() => {
                    // Redirect to dashboard orders tab
                    navigate(`${dashboardPath}?tab=orders&success=true`);
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
                                    placeholder={copy.placeholders.email}
                                />
                            </div>
                        </div>

                        <label className="checkbox-row">
                            <input
                                type="checkbox"
                                checked={privacyAccepted}
                                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                            />
                            <span>{copy.fields.privacyAccepted}</span>
                        </label>

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

                {step === 2 && (
                    <div className="checkout-card">
                        <div className="step-intro">
                            <h2>{copy.intro.termsTitle}</h2>
                            <p>{copy.intro.termsDescription}</p>
                        </div>

                        <div className="terms-content" ref={termsContentRef} onScroll={handleTermsScroll}>
                            <h3>{copy.terms.title}</h3>
                            {copy.terms.items.map((item) => (
                                <p key={item}>{item}</p>
                            ))}
                        </div>

                        {termsReachedEnd && !termsAccepted && (
                            <button
                                type="button"
                                className="btn-next"
                                onClick={() => {
                                    setTermsAccepted(true);
                                    setStep(3);
                                }}
                            >
                                {copy.buttons.acceptTerms}
                            </button>
                        )}

                        {!termsReachedEnd && (
                            <div className="terms-hint">
                                {copy.terms.hint}
                            </div>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className="checkout-grid">
                        {/* Order Summary */}
                        <div className="order-summary">
                            <h2>
                                <HiShoppingBag /> {copy.summary.title}
                            </h2>

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

                            <div className="summary-total">
                                <span>{copy.summary.total}</span>
                                <strong>{formatPrice(getTotalPrice(), 'TL')}</strong>
                            </div>
                        </div>

                        {/* Payment Form */}
                        <div className="payment-section">
                            <h2>
                                <HiCreditCard /> {copy.payment.title}
                            </h2>

                            <div className="payment-method-box">
                                <HiShieldCheck />
                                <div>
                                    <strong>{copy.payment.providerTitle}</strong>
                                    <p>{copy.payment.providerDescription}</p>
                                </div>
                            </div>

                            {useHostedPayment ? (
                                <div className="payment-method-box">
                                    <HiShieldCheck />
                                    <div>
                                        <strong>{copy.payment.hostedTitle}</strong>
                                        <p>{copy.payment.hostedDescription}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="field-grid">
                                    <div className="form-group">
                                        <label>{copy.fields.cardName}</label>
                                        <input
                                            className="form-control"
                                            value={cardHolderName}
                                            onChange={(e) => setCardHolderName(e.target.value)}
                                            placeholder={copy.placeholders.cardName}
                                            autoComplete="cc-name"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{copy.fields.cardNumber}</label>
                                        <input
                                            className="form-control"
                                            value={cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ')}
                                            onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 19))}
                                            placeholder="0000 0000 0000 0000"
                                            inputMode="numeric"
                                            autoComplete="cc-number"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{copy.fields.expireMonth}</label>
                                        <input
                                            className="form-control"
                                            value={cardExpireMonth}
                                            onChange={(e) => setCardExpireMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                                            placeholder="AA"
                                            inputMode="numeric"
                                            autoComplete="cc-exp-month"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{copy.fields.expireYear}</label>
                                        <input
                                            className="form-control"
                                            value={cardExpireYear}
                                            onChange={(e) => setCardExpireYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                            placeholder="YYYY"
                                            inputMode="numeric"
                                            autoComplete="cc-exp-year"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>CVV</label>
                                        <input
                                            className="form-control"
                                            type="password"
                                            value={cardCvv}
                                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                            placeholder="123"
                                            inputMode="numeric"
                                            autoComplete="cc-csc"
                                        />
                                    </div>
                                </div>
                            )}

                            <label className="checkbox-row business-buying">
                                <input
                                    type="checkbox"
                                    checked={buyingAsBusiness}
                                    onChange={(e) => setBuyingAsBusiness(e.target.checked)}
                                />
                                <span>{copy.fields.businessPurchase}</span>
                            </label>

                            {buyingAsBusiness && (
                                <div className="field-grid">
                                    <div className="form-group">
                                        <label>{copy.fields.companyName}</label>
                                        <input
                                            className="form-control"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            placeholder={copy.placeholders.companyName}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{copy.fields.taxNumber}</label>
                                        <input
                                            className="form-control"
                                            value={taxNumber}
                                            onChange={(e) => setTaxNumber(e.target.value.replace(/\D/g, ''))}
                                            placeholder={copy.placeholders.taxNumber}
                                            maxLength={11}
                                        />
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handlePayment} className="payment-form">
                                <button type="submit" className="btn-pay" disabled={loading}>
                                    {loading
                                        ? copy.buttons.processing
                                        : buyingAsBusiness
                                            ? copy.buttons.completePayment
                                            : copy.buttons.buyAndPay}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
