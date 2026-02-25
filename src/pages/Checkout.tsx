import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { ordersAPI, paymentAPI } from '../services/api';
import { HiCheckCircle, HiCreditCard, HiShieldCheck, HiShoppingBag } from 'react-icons/hi';
import './Checkout.css';

export default function Checkout() {
    const useHostedPayment = false;
    const API_BASE = import.meta.env.VITE_API_URL || '/api';
    const { user, isAuthenticated, activateToken } = useAuth();
    const { items, getTotalPrice, clearCart } = useCart();
    const navigate = useNavigate();
    const termsContentRef = useRef<HTMLDivElement | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [termsReachedEnd, setTermsReachedEnd] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [country, setCountry] = useState('Türkiye');
    const [email, setEmail] = useState(user?.email || '');
    const [buyingAsBusiness, setBuyingAsBusiness] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [taxNumber, setTaxNumber] = useState('');
    const [cardHolderName, setCardHolderName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpireMonth, setCardExpireMonth] = useState('');
    const [cardExpireYear, setCardExpireYear] = useState('');
    const [cardCvv, setCardCvv] = useState('');

    const stepTitle = useMemo(() => {
        if (step === 1) return 'Satın Alma Bilgileri';
        if (step === 2) return 'Hizmet Şartları';
        return 'Ödeme';
    }, [step]);

    useEffect(() => {
        if (items.length === 0) {
            navigate('/');
        }
    }, [items, navigate]);

    useEffect(() => {
        if (!user?.email) return;
        setEmail(user.email);
    }, [user?.email]);

    const validateStepOne = () => {
        if (!country) {
            setError('Lütfen ülke seçin.');
            return false;
        }
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            setError('Geçerli bir e-posta girin.');
            return false;
        }
        if (!privacyAccepted) {
            setError('Devam etmek için gizlilik politikasını onaylamalısınız.');
            return false;
        }
        return true;
    };

    const validateBusinessInfo = () => {
        if (!buyingAsBusiness) return true;

        const vkn = taxNumber.trim();
        if (!companyName.trim()) {
            setError('İşletme adı zorunludur.');
            return false;
        }
        if (!/^\d{10,11}$/.test(vkn)) {
            setError('Vergi numarası 10 veya 11 haneli olmalıdır.');
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
            setError('Kart üzerindeki ad soyad bilgisini girin.');
            return false;
        }
        if (normalizedNumber.length < 12 || normalizedNumber.length > 19) {
            setError('Geçerli bir kart numarası girin.');
            return false;
        }
        if (!isLuhnValid) {
            setError('Kart numarası doğrulanamadı. Lütfen kontrol edin.');
            return false;
        }
        if (!Number.isInteger(normalizedMonth) || normalizedMonth < 1 || normalizedMonth > 12) {
            setError('Geçerli bir son kullanma ayı girin (01-12).');
            return false;
        }
        if (!Number.isInteger(normalizedYear) || normalizedYear < currentYear || normalizedYear > currentYear + 20) {
            setError('Geçerli bir son kullanma yılı girin.');
            return false;
        }
        if (normalizedYear === currentYear && normalizedMonth < currentMonth) {
            setError('Kartın son kullanma tarihi geçmiş görünüyor.');
            return false;
        }
        if (!/^\d{3,4}$/.test(normalizedCvv)) {
            setError('Geçerli bir CVV girin.');
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
                    throw new Error('İşletme bilgileri kaydedilemedi.');
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
                    navigate('/dashboard?tab=orders&success=true');
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
            setError(err.response?.data?.error || err.message || 'Ödeme işlemi başarısız');
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
                        <h2>Ödeme Başarılı!</h2>
                        <p>Siparişiniz alındı. Yönlendiriliyorsunuz...</p>
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
                    <div className={`checkout-step ${step >= 1 ? 'active' : ''}`}>1. Bilgiler</div>
                    <div className={`checkout-step ${step >= 2 ? 'active' : ''}`}>2. Şartlar</div>
                    <div className={`checkout-step ${step >= 3 ? 'active' : ''}`}>3. Ödeme</div>
                </div>

                {error && <div className="checkout-error">{error}</div>}

                {step === 1 && (
                    <div className="checkout-card">
                        <div className="step-intro">
                            <h2>Satın alma bilgileri</h2>
                            <p>Devam etmeden önce temel bilgileri doğrulayın.</p>
                        </div>

                        <div className="field-grid">
                            <div className="form-group">
                                <label>Ülke</label>
                                <select className="form-control" value={country} onChange={(e) => setCountry(e.target.value)}>
                                    <option>Türkiye</option>
                                    <option>Almanya</option>
                                    <option>Hollanda</option>
                                    <option>İngiltere</option>
                                    <option>Amerika Birleşik Devletleri</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>E-posta</label>
                                <input
                                    className="form-control"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ornek@email.com"
                                />
                            </div>
                        </div>

                        <label className="checkbox-row">
                            <input
                                type="checkbox"
                                checked={privacyAccepted}
                                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                            />
                            <span>Gizlilik politikasını okudum, kabul ediyorum.</span>
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
                                Devam Et
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="checkout-card">
                        <div className="step-intro">
                            <h2>Hizmet Şartları</h2>
                            <p>Devam etmek için metnin sonuna kadar inin.</p>
                        </div>

                        <div className="terms-content" ref={termsContentRef} onScroll={handleTermsScroll}>
                            <h3>Khilonfast Hizmet Şartları</h3>
                            <p>Bu platform üzerinden satın alınan dijital hizmet ve içerikler, satın alma yapan kullanıcı hesabına tanımlanır.</p>
                            <p>Satın alma işlemi tamamlandıktan sonra kullanıcı panelindeki “İçeriklerim” alanından erişim sağlanır.</p>
                            <p>Kullanıcı, hesabını ve ödeme bilgilerini doğru beyan etmekle yükümlüdür.</p>
                            <p>Hizmet kapsamında sağlanan içeriklerin üçüncü kişilerle paylaşılması yasaktır.</p>
                            <p>İçeriklerin izinsiz çoğaltılması, dağıtılması veya ticari amaçla yeniden kullanımı kabul edilmez.</p>
                            <p>Khilonfast, teknik bakım ve altyapı güncellemeleri nedeniyle hizmette planlı kesinti yapabilir.</p>
                            <p>Kullanıcı, satın alma öncesi ürün içeriğini ve kapsamını kontrol ederek işlem yapar.</p>
                            <p>Ödeme işlemleri, entegre sanal POS altyapısı üzerinden güvenli şekilde yürütülür.</p>
                            <p>İşletme adına yapılan satın alımlarda beyan edilen vergi bilgileri faturalandırma için esas alınır.</p>
                            <p>Yanlış veya eksik beyanlardan kaynaklı mali yükümlülük kullanıcıya aittir.</p>
                            <p>Khilonfast, hukuki yükümlülük durumlarında kayıtları ilgili mercilerle paylaşabilir.</p>
                            <p>Platform kullanımına devam edilmesi, burada belirtilen şartların kabul edildiği anlamına gelir.</p>
                            <p>Bu şartlar gerektiğinde güncellenebilir ve güncel metin platform üzerinde yayımlanır.</p>
                            <p>Şartların tamamını okuyup onayladığınızda bir sonraki adıma geçebilirsiniz.</p>
                            <p>Bu metin örnek amaçlıdır. Nihai hukuki metinlerinizi bu alana ekleyip kullanabilirsiniz.</p>
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
                                Kabul Et ve Devam Et
                            </button>
                        )}

                        {!termsReachedEnd && (
                            <div className="terms-hint">
                                Yazının sonuna indiğinizde “Kabul Et ve Devam Et” butonu aktif olur.
                            </div>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className="checkout-grid">
                        {/* Order Summary */}
                        <div className="order-summary">
                            <h2>
                                <HiShoppingBag /> Sipariş Özeti
                            </h2>

                            <div className="summary-items">
                                {items.map((item) => (
                                    <div key={item.id} className="summary-item">
                                        <div>
                                            <h3>{item.name}</h3>
                                        </div>
                                        <div className="item-price">
                                            {item.price.toLocaleString('tr-TR')} {item.currency}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="summary-total">
                                <span>Toplam:</span>
                                <strong>{getTotalPrice().toLocaleString('tr-TR')} TL</strong>
                            </div>
                        </div>

                        {/* Payment Form */}
                        <div className="payment-section">
                            <h2>
                                <HiCreditCard /> Ödeme Yöntemi
                            </h2>

                            <div className="payment-method-box">
                                <HiShieldCheck />
                                <div>
                                    <strong>Lidio Sanal POS</strong>
                                    <p>Ödemeniz güvenli ödeme altyapısı üzerinden tamamlanacaktır.</p>
                                </div>
                            </div>

                            {useHostedPayment ? (
                                <div className="payment-method-box">
                                    <HiShieldCheck />
                                    <div>
                                        <strong>Kart bilgisi Lidio ekranında girilecek</strong>
                                        <p>Satın al butonundan sonra güvenli Lidio ödeme sayfasına yönlendirileceksiniz.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="field-grid">
                                    <div className="form-group">
                                        <label>Kart Üzerindeki İsim</label>
                                        <input
                                            className="form-control"
                                            value={cardHolderName}
                                            onChange={(e) => setCardHolderName(e.target.value)}
                                            placeholder="AD SOYAD"
                                            autoComplete="cc-name"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Kart Numarası</label>
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
                                        <label>Son Kullanma Ay</label>
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
                                        <label>Son Kullanma Yıl</label>
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
                                <span>İşletme olarak satın alıyorum</span>
                            </label>

                            {buyingAsBusiness && (
                                <div className="field-grid">
                                    <div className="form-group">
                                        <label>İşletme Adı</label>
                                        <input
                                            className="form-control"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            placeholder="Firma unvanı"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>VKN / Vergi Numarası</label>
                                        <input
                                            className="form-control"
                                            value={taxNumber}
                                            onChange={(e) => setTaxNumber(e.target.value.replace(/\D/g, ''))}
                                            placeholder="10 veya 11 hane"
                                            maxLength={11}
                                        />
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handlePayment} className="payment-form">
                                <button type="submit" className="btn-pay" disabled={loading}>
                                    {loading
                                        ? 'İşleniyor...'
                                        : buyingAsBusiness
                                            ? 'Ödemeyi Tamamla'
                                            : 'Satın Al ve Öde'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
