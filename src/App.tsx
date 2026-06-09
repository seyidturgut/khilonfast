import { useLayoutEffect, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, matchPath, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ReactElement } from 'react'
import './App.css'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'
import Header from './components/Header'
import Footer from './components/Footer'
import CookieConsent from './components/CookieConsent'
import ScrollToTop from './components/ScrollToTop'
import SeoHead from './components/SeoHead'
import CurrencyConflictModal from './components/CurrencyConflictModal'
// Public sayfalar — lazy (route-bazlı code splitting; prerender puppeteer+2sn ile içerik korunur)
const Home = lazy(() => import('./pages/Home'))
const GoToMarket = lazy(() => import('./pages/GoToMarket'))
const ContentStrategy = lazy(() => import('./pages/ContentStrategy'))
const IntegratedDigitalMarketing = lazy(() => import('./pages/IntegratedDigitalMarketing'))
const B2BIntegratedMarketing = lazy(() => import('./pages/B2BIntegratedMarketing'))
const FintechIntegratedMarketing = lazy(() => import('./pages/FintechIntegratedMarketing'))
const ManufacturingIntegratedMarketing = lazy(() => import('./pages/ManufacturingIntegratedMarketing'))
const EnergyIntegratedMarketing = lazy(() => import('./pages/EnergyIntegratedMarketing'))
const FleetRentalIntegratedMarketing = lazy(() => import('./pages/FleetRentalIntegratedMarketing'))
const InteriorDesignIntegratedMarketing = lazy(() => import('./pages/InteriorDesignIntegratedMarketing'))
const SoftwareIntegratedMarketing = lazy(() => import('./pages/SoftwareIntegratedMarketing'))
const IndustrialFoodIntegratedMarketing = lazy(() => import('./pages/IndustrialFoodIntegratedMarketing'))
const PaymentSystemsIntegratedMarketing = lazy(() => import('./pages/PaymentSystemsIntegratedMarketing'))
const GiftCardMarketing = lazy(() => import('./pages/GiftCardMarketing'))
const FuelMarketing = lazy(() => import('./pages/FuelMarketing'))
const GiftCardIntegratedMarketing = lazy(() => import('./pages/GiftCardIntegratedMarketing'))
const FuelIntegratedMarketing = lazy(() => import('./pages/FuelIntegratedMarketing'))
const GoogleAds = lazy(() => import('./pages/GoogleAds'))
const SocialMediaAds = lazy(() => import('./pages/SocialMediaAds'))
const SeoService = lazy(() => import('./pages/SeoService'))
const ContentProduction = lazy(() => import('./pages/ContentProduction'))
const B2BEmailMarketing = lazy(() => import('./pages/B2BEmailMarketing'))
const B2BThreeSixtyMarketing = lazy(() => import('./pages/B2BThreeSixtyMarketing'))
const PaymentSystemsMarketing = lazy(() => import('./pages/PaymentSystemsMarketing'))
const IndustrialFoodMarketing = lazy(() => import('./pages/IndustrialFoodMarketing'))
const FintechMarketing = lazy(() => import('./pages/FintechMarketing'))
const SoftwareMarketing = lazy(() => import('./pages/SoftwareMarketing'))
const EnergyMarketing = lazy(() => import('./pages/EnergyMarketing'))
const InteriorDesignMarketing = lazy(() => import('./pages/InteriorDesignMarketing'))
const FleetRentalMarketing = lazy(() => import('./pages/FleetRentalMarketing'))
const ManufacturingMarketing = lazy(() => import('./pages/ManufacturingMarketing'))
const About = lazy(() => import('./pages/About'))
const HowItWorks = lazy(() => import('./pages/HowItWorks'))
const MaestroAI = lazy(() => import('./pages/MaestroAI'))
const MaestroAISector = lazy(() => import('./pages/MaestroAISector'))
const EyeTracking = lazy(() => import('./pages/EyeTracking'))
const SearchConsoleSetup = lazy(() => import('./pages/SearchConsoleSetup'))
const SetupFlowPage = lazy(() => import('./pages/SetupFlowPage'))
const IntegratedMarketingSetupFlow = lazy(() => import('./pages/IntegratedMarketingSetupFlow'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
// Auth/checkout/dashboard — lazy (not prerendered)
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const SetPassword = lazy(() => import('./pages/SetPassword'))
const Checkout = lazy(() => import('./pages/Checkout'))
const DanismanlikOdeme = lazy(() => import('./pages/DanismanlikOdeme'))
const DanismanlikRandevu = lazy(() => import('./pages/DanismanlikRandevu'))
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'))
const PaymentCallback = lazy(() => import('./pages/PaymentCallback'))
const UnsubscribePage = lazy(() => import('./pages/UnsubscribePage'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Trainings = lazy(() => import('./pages/Trainings'))
const TrainingProgramPage = lazy(() => import('./pages/TrainingProgramPage'))
const Consulting = lazy(() => import('./pages/Consulting'))
const ConsultingProgramPage = lazy(() => import('./pages/ConsultingProgramPage'))
const Consultants = lazy(() => import('./pages/Consultants'))
const ConsultantDetail = lazy(() => import('./pages/ConsultantDetail'))
const LegacyWordpressPage = lazy(() => import('./pages/LegacyWordpressPage'))
const ProductSlugResolver = lazy(() => import('./pages/ProductSlugResolver'))
const LegalPage = lazy(() => import('./pages/LegalPage'))
import { trainingPrograms } from './data/trainingPrograms'
import { consultingPrograms } from './data/consultingPrograms'
import { productPrograms } from './data/productPrograms'
import { setupFlows } from './data/setupFlows'
import { resolveLocaleFromPath } from './utils/locale'
import { normalizeBrandTextNodes } from './utils/brandText'
import { ConsentProvider } from './context/ConsentContext'
import trCommon from './locales/tr/common.json'
import enCommon from './locales/en/common.json'

// Admin Pages — lazy loaded (admin/CRM/automation never reached by public users)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const SettingsPage = lazy(() => import('./pages/admin/Settings'))
const ProductList = lazy(() => import('./pages/admin/ProductList'))
const ProductEditor = lazy(() => import('./pages/admin/ProductEditor'))
const UsersPage = lazy(() => import('./pages/admin/Users'))
const PagesList = lazy(() => import('./pages/admin/Pages'))
const PageBuilder = lazy(() => import('./pages/admin/PageBuilder'))
const TrainingContentEditor = lazy(() => import('./pages/admin/TrainingContentEditor'))
const TrainingAnalytics = lazy(() => import('./pages/admin/TrainingAnalytics'))
const TrainingAccessPages = lazy(() => import('./pages/admin/TrainingAccessPages'))
const TrainingContentPage = lazy(() => import('./pages/TrainingContentPage'))
const OnboardingForm = lazy(() => import('./pages/OnboardingForm'))
const OnboardingPresentation = lazy(() => import('./pages/OnboardingPresentation'))
const ConsultantList = lazy(() => import('./pages/admin/ConsultantList'))
const ConsultantEditor = lazy(() => import('./pages/admin/ConsultantEditor'))
const BookingList = lazy(() => import('./pages/admin/BookingList'))
const CouponList = lazy(() => import('./pages/admin/CouponList'))
const BankAccountsAdmin = lazy(() => import('./pages/admin/BankAccounts'))
const ManualBankAccountsAdmin = lazy(() => import('./pages/admin/ManualBankAccounts'))
const ManualOrdersAdmin = lazy(() => import('./pages/admin/ManualOrders'))
const OnboardingFormsList = lazy(() => import('./pages/admin/OnboardingFormsList'))
const EyeTrackingUploadsList = lazy(() => import('./pages/admin/EyeTrackingUploadsList'))
const AdminSubscriptions = lazy(() => import('./pages/admin/Subscriptions'))
const EmailAutomation = lazy(() => import('./pages/admin/EmailAutomation'))
const InvoicesList = lazy(() => import('./pages/admin/InvoicesList'))
const InvoiceDetail = lazy(() => import('./pages/admin/InvoiceDetail'))
const AutomationListPage = lazy(() => import('./automation/pages/AutomationListPage'))
const AutomationBuilderPage = lazy(() => import('./automation/pages/AutomationBuilderPage'))
const EmailTemplatesPage = lazy(() => import('./automation/pages/EmailTemplatesPage'))
const AutomationLogsPage = lazy(() => import('./automation/pages/AutomationLogsPage'))
const ExecutionsPage = lazy(() => import('./automation/pages/ExecutionsPage'))
const CrmContactsPage = lazy(() => import('./pages/admin/crm/Contacts'))
const CrmContactDetailPage = lazy(() => import('./pages/admin/crm/ContactDetail'))
const CrmTagsPage = lazy(() => import('./pages/admin/crm/Tags'))
const CrmListsPage = lazy(() => import('./pages/admin/crm/Lists'))
const CrmListDetailPage = lazy(() => import('./pages/admin/crm/Lists').then(m => ({ default: m.CrmListDetailPage })))
const CrmCustomFieldsPage = lazy(() => import('./pages/admin/crm/CustomFields'))
const CrmScoringRulesPage = lazy(() => import('./pages/admin/crm/ScoringRules'))
const CrmSmartLinksPage = lazy(() => import('./pages/admin/crm/SmartLinks'))
const CrmCampaignsPage = lazy(() => import('./pages/admin/crm/Campaigns'))
const CrmCampaignDetailPage = lazy(() => import('./pages/admin/crm/CampaignDetail'))
const CrmFormsPage = lazy(() => import('./pages/admin/crm/Forms'))
const CrmFormDetailPage = lazy(() => import('./pages/admin/crm/FormDetail'))
const CrmImportPage = lazy(() => import('./pages/admin/crm/Import'))
const CrmDashboardPage = lazy(() => import('./pages/admin/crm/Dashboard'))
const CrmFunnelsPage = lazy(() => import('./pages/admin/crm/Funnels'))
const AutomationTestPage = lazy(() => import('./pages/admin/AutomationTest'))

const slugsTr = trCommon.slugs as Record<string, string>
const slugsEn = enCommon.slugs as Record<string, string>
const slugValuesTr = Object.values(slugsTr).filter(Boolean)
const slugValuesEn = Object.values(slugsEn).filter(Boolean)

function RedirectWithQuery({ to }: { to: string }) {
    const location = useLocation();
    return <Navigate to={`${to}${location.search}`} replace />;
}

function RequireAdmin({ children }: { children: ReactElement }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <div style={{ padding: '64px', textAlign: 'center' }}>Yükleniyor...</div>;
    }

    if (!user) {
        return <Navigate to="/giris" replace />;
    }

    if (user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return children;
}

function MainContent() {
    const location = useLocation();
    const routeLang = resolveLocaleFromPath(location.pathname);
    const isAdminRoute = location.pathname.startsWith('/admin');
    const isPlayerRoute = location.pathname.startsWith('/egitimllerim/') || location.pathname.startsWith('/en/egitimllerim/');
    const knownRoutePatterns = [
        '/',
        '/hakkimizda',
        '/nasil-calisir',
        '/khilonfast-nasil-calisir-hizli-profesyonel-ve-sonuc-odakli-pazarlama-deneyimi',
        '/hizmetlerimiz/go-to-market-stratejisi',
        '/hizmetlerimiz/icerik-stratejisi',
        '/hizmetlerimiz/butunlesik-dijital-pazarlama',
        '/hizmetlerimiz/b2b-butunlesik-dijital-pazarlama',
        '/en/services/b2b-integrated-digital-marketing',
        '/hizmetlerimiz/fintech-butunlesik-dijital-pazarlama',
        '/en/services/fintech-integrated-digital-marketing',
        '/hizmetlerimiz/uretim-butunlesik-dijital-pazarlama',
        '/en/services/manufacturing-integrated-digital-marketing',
        '/hizmetlerimiz/enerji-butunlesik-dijital-pazarlama',
        '/en/services/energy-integrated-digital-marketing',
        '/hizmetlerimiz/filo-kiralama-butunlesik-dijital-pazarlama',
        '/en/services/fleet-rental-integrated-digital-marketing',
        '/hizmetlerimiz/ofis-tasarim-butunlesik-dijital-pazarlama',
        '/en/services/office-design-integrated-digital-marketing',
        '/hizmetlerimiz/teknoloji-yazilim-butunlesik-dijital-pazarlama',
        '/en/services/tech-software-integrated-digital-marketing',
        '/hizmetlerimiz/endustriyel-gida-butunlesik-dijital-pazarlama',
        '/en/services/industrial-food-integrated-digital-marketing',
        '/hizmetlerimiz/odeme-sistemleri-butunlesik-dijital-pazarlama',
        '/en/services/payment-systems-integrated-digital-marketing',
        '/hizmetlerimiz/google-ads',
        '/hizmetlerimiz/sosyal-medya-reklamciligi',
        '/hizmetlerimiz/seo-yonetimi',
        '/hizmetlerimiz/icerik-uretimi',
        '/hizmetlerimiz/b2b-email-pazarlama',
        '/sektorel-hizmetler/b2b-firmalari-icin-360-pazarlama-yonetimi',
        '/sektorel-hizmetler/odeme-sistemleri-firmalari-icin-360-pazarlama-yonetimi',
        '/sektorel-hizmetler/endustriyel-gida-sef-cozumleri-firmalari-icin-360-pazarlama-yonetimi',
        '/sektorel-hizmetler/fintech-firmalari-icin-360-pazarlama-yonetimi',
        '/sektorel-hizmetler/teknoloji-yazilim-firmalari-icin-360-pazarlama-yonetimi',
        '/sektorel-hizmetler/enerji-firmalari-icin-360-pazarlama-yonetimi',
        '/sektorel-hizmetler/ofis-kurumsal-ic-tasarim-firmalari-icin-360-pazarlama-yonetimi',
        '/sektorel-hizmetler/filo-kiralama-firmalari-icin-360-pazarlama-yonetimi',
        '/sektorel-hizmetler/uretim-firmalari-icin-360-pazarlama-yonetimi',
        '/sektorel-hizmetler/b2b-360-pazarlama-yonetimi',
        '/sektorel-hizmetler/odeme-sistemleri-firmalari-360-pazarlama-yonetimi',
        '/sektorel-hizmetler/endustriyel-gida-sef-cozumleri-firmalari-360-pazarlama-yonetimi',
        '/sektorel-hizmetler/fintech-firmalari-360-pazarlama-yonetimi',
        '/sektorel-hizmetler/teknoloji-yazilim-firmalari-360-pazarlama-yonetimi',
        '/sektorel-hizmetler/enerji-firmalari-360-pazarlama-yonetimi',
        '/sektorel-hizmetler/ofis-kurumsal-ic-tasarim-firmalari-360-pazarlama-yonetimi',
        '/sektorel-hizmetler/filo-kiralama-firmalari-360-pazarlama-yonetimi',
        '/sektorel-hizmetler/uretim-firmalari-360-pazarlama-yonetimi',
        '/hizmetlerimiz/buyume-odakli-pazarlama-egitimi',
        '/egitimler/buyume-odakli-pazarlama-egitimi',
        '/courses/odeme-sistemlerinde-buyume-odakli-pazarlama',
        '/odeme-sistemlerinde-buyume-odakli-pazarlama-egitimi',
        '/hizmetlerimiz/maestro-ai',
        '/urunler/maestro-ai',
        '/urunler/maestro-ai-b2b',
        '/urunler/maestro-ai-odeme-sistemleri',
        '/urunler/maestro-ai-endustriyel-gida',
        '/urunler/maestro-ai-fintech',
        '/urunler/maestro-ai-enerji',
        '/urunler/maestro-ai-ofis-tasarim',
        '/urunler/maestro-ai-filo-kiralama',
        '/urunler/maestro-ai-teknoloji-yazilim',
        '/urunler/maestro-ai-uretim',
        '/urunler/maestro-ai-hediye-karti',
        '/urunler/maestro-ai-akaryakit',
        '/products/maestro-ai-technology-software',
        '/products/maestro-ai-manufacturing',
        '/products/maestro-ai-corporate-gift-card',
        '/products/maestro-ai-corporate-fuel',
        '/hizmetlerimiz/hediye-karti-butunlesik-dijital-pazarlama',
        '/hizmetlerimiz/akaryakit-butunlesik-dijital-pazarlama',
        '/en/services/corporate-gift-card-integrated-digital-marketing',
        '/en/services/corporate-fuel-integrated-digital-marketing',
        '/hizmetlerimiz/eye-tracking-reklam-analizi',
        '/b2b-pazarlama-stratejinizi-maestro-ai-ile-yonetin-copy',
        '/hizmetler/eye-tracking-reklam-analizi',
        '/hizmetlerimiz/google-search-console-kurulum-akisi',
        '/butunlesik-pazarlama-kurulum-akisi',
        ...setupFlows.map((flow) => flow.path),
        '/egitimler',
        '/giris',
        '/iletisim',
        '/kayit-ol',
        '/login',
        '/register',
        '/checkout',
        '/odeme',
        '/danismanlik-odeme/:bookingId',
        '/danismanlik/randevu/:bookingId',
        '/payment-success',
        '/payment-callback',
        '/abonelikten-cik',
        '/unsubscribe',
        '/dashboard',
        `/${slugsTr.onboardingForm}`,
        `/en/${slugsEn.onboardingForm}`,
        '/admin',
        '/admin/settings',
        '/admin/products',
        '/admin/products/new',
        '/admin/products/edit/:id',
        '/admin/pages',
        '/admin/pages/new',
        '/admin/pages/edit/:id',
        '/admin/training-pages/*',
        '/admin/users',
        '/admin/consultants',
        '/admin/consultants/new',
        '/admin/consultants/:id',
        '/admin/bookings',
        '/admin/invoices',
        '/admin/invoices/:orderId',
        '/admin/training-analytics',
        '/admin/training-content',
        '/admin/coupons',
        '/admin/bank-accounts',
        '/admin/onboarding-forms',
        '/admin/subscriptions',
        '/egitimllerim/:slug',
        '/en/egitimllerim/:slug',
        '/danismanlar',
        '/danismanlar/:slug',
        '/consultants',
        '/consultants/:slug',
        `/${slugsTr.consulting}`,
        `/${slugsTr.consulting}/:id`,
        `/${slugsEn.consulting}`,
        `/${slugsEn.consulting}/:id`,
        `/${slugsTr.trainings}`,
        `/${slugsTr.trainings}/:id`,
        `/${slugsEn.trainings}`,
        `/${slugsEn.trainings}/:id`,
        ...slugValuesTr.map((slug) => `/${slug}`),
        ...slugValuesEn.map((slug) => `/${slug}`),
        ...trainingPrograms.map((program) => program.path),
        ...consultingPrograms.map((program) => program.path),
        ...productPrograms.map((product) => product.path)
    ];
    const isKnownRoute = knownRoutePatterns.some((pattern) =>
        Boolean(matchPath({ path: pattern, end: true }, location.pathname)) ||
        Boolean(matchPath({ path: `/en${pattern === '/' ? '' : pattern}`, end: true }, location.pathname))
    );
    const isLegacyRoute = !isAdminRoute && !isKnownRoute;

    // Sync i18n language with URL locale in real time
    const { i18n } = useTranslation();
    useLayoutEffect(() => {
        const activeLang = i18n.language.split('-')[0];
        if (activeLang !== routeLang) {
            i18n.changeLanguage(routeLang);
        }
        document.documentElement.lang = routeLang;
    }, [routeLang, i18n]);

    // SPA sayfa görüntüleme köprüsü — her route değişiminde GTM'e bildir.
    // GA4, Meta Pixel ve LinkedIn Insight bu tek 'spa_page_view' event'ini
    // ortak tetikleyici olarak kullanır (SPA geçişlerinde PageView ateşlenmesi için).
    // Admin paneli analitiğe dahil edilmez.
    useEffect(() => {
        if (typeof window === 'undefined' || isAdminRoute) return;
        // title'ın güncellenmesi için bir tik bekle (SeoHead route sonrası set ediyor)
        const id = window.setTimeout(() => {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                event: 'spa_page_view',
                page_path: location.pathname + location.search,
                page_location: window.location.href,
                page_title: document.title
            });
        }, 50);
        return () => window.clearTimeout(id);
    }, [location.pathname, location.search, isAdminRoute]);

    useLayoutEffect(() => {
        normalizeBrandTextNodes();

        const observer = new MutationObserver(() => {
            normalizeBrandTextNodes();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });

        return () => observer.disconnect();
    }, [location.pathname]);

    return (
        <>
            <SeoHead />
            <ScrollToTop />
            {!isAdminRoute && !isLegacyRoute && !isPlayerRoute && <Header />}
            <main
                key={`lang-${routeLang}`}
                className={isAdminRoute ? 'admin-main' : isLegacyRoute ? 'legacy-main' : ''}
            >
                <Suspense fallback={<div style={{ padding: '64px', textAlign: 'center', color: '#1e3a5f' }}>Yükleniyor...</div>}>
                <Routes>
                    {/* English Routes */}
                    <Route path="/en">
                        <Route index element={<Home />} />
                        <Route path={slugsEn.about} element={<About />} />
                        <Route path={slugsEn.howItWorks} element={<HowItWorks />} />
                        <Route path={slugsEn.trainings} element={<Trainings />} />
                        <Route path={`${slugsEn.trainings}/:id`} element={<TrainingProgramPage />} />
                        <Route path={slugsEn.consulting} element={<Consulting />} />
                        <Route path={`${slugsEn.consulting}/:id`} element={<ConsultingProgramPage />} />
                        <Route path="consultants" element={<Consultants />} />
                        <Route path="consultants/:slug" element={<ConsultantDetail />} />
                        <Route path={slugsEn.gtm} element={<GoToMarket />} />
                        <Route path={slugsEn.contentStrategy} element={<ContentStrategy />} />
                        <Route path={slugsEn.idm} element={<IntegratedDigitalMarketing />} />
                        <Route path="services/b2b-integrated-digital-marketing" element={<B2BIntegratedMarketing />} />
                        <Route path="services/fintech-integrated-digital-marketing" element={<FintechIntegratedMarketing />} />
                        <Route path="services/manufacturing-integrated-digital-marketing" element={<ManufacturingIntegratedMarketing />} />
                        <Route path="services/energy-integrated-digital-marketing" element={<EnergyIntegratedMarketing />} />
                        <Route path="services/fleet-rental-integrated-digital-marketing" element={<FleetRentalIntegratedMarketing />} />
                        <Route path="services/office-design-integrated-digital-marketing" element={<InteriorDesignIntegratedMarketing />} />
                        <Route path="services/tech-software-integrated-digital-marketing" element={<SoftwareIntegratedMarketing />} />
                        <Route path="services/industrial-food-integrated-digital-marketing" element={<IndustrialFoodIntegratedMarketing />} />
                        <Route path="services/payment-systems-integrated-digital-marketing" element={<PaymentSystemsIntegratedMarketing />} />
                        <Route path="services/corporate-gift-card-integrated-digital-marketing" element={<GiftCardIntegratedMarketing />} />
                        <Route path="services/corporate-fuel-integrated-digital-marketing" element={<FuelIntegratedMarketing />} />
                        <Route path={slugsEn.googleAds} element={<GoogleAds />} />
                        <Route path={slugsEn.socialAds} element={<SocialMediaAds />} />
                        <Route path={slugsEn.seo} element={<SeoService />} />
                        <Route path={slugsEn.contentProduction} element={<ContentProduction />} />
                        <Route path={slugsEn.b2bEmail} element={<B2BEmailMarketing />} />
                        <Route path={slugsEn.sectoralB2B} element={<B2BThreeSixtyMarketing />} />
                        <Route path={slugsEn.sectoralPayment} element={<PaymentSystemsMarketing />} />
                        <Route path={slugsEn.sectoralFood} element={<IndustrialFoodMarketing />} />
                        <Route path={slugsEn.sectoralFintech} element={<FintechMarketing />} />
                        <Route path={slugsEn.sectoralTech} element={<SoftwareMarketing />} />
                        <Route path={slugsEn.sectoralEnergy} element={<EnergyMarketing />} />
                        <Route path={slugsEn.sectoralDesign} element={<InteriorDesignMarketing />} />
                        <Route path={slugsEn.sectoralFleet} element={<FleetRentalMarketing />} />
                        <Route path={slugsEn.sectoralManufacturing} element={<ManufacturingMarketing />} />
                        <Route path={slugsEn.sectoralGiftCard} element={<GiftCardMarketing />} />
                        <Route path={slugsEn.sectoralFuel} element={<FuelMarketing />} />
                        <Route path={slugsEn.maestro} element={<MaestroAI />} />
                        <Route path={slugsEn.eyeTracking} element={<EyeTracking />} />
                        <Route path={slugsEn.contact} element={<ContactPage />} />
                        <Route path={slugsEn.privacyPolicy} element={<LegalPage documentKey="privacyPolicy" />} />
                        <Route path={slugsEn.cookiePolicy} element={<LegalPage documentKey="cookiePolicy" />} />
                        <Route path={slugsEn.termsOfService} element={<LegalPage documentKey="termsOfService" />} />
                        <Route path={slugsEn.refundPolicy} element={<LegalPage documentKey="refundPolicy" />} />
                        <Route path={slugsEn.distanceSale} element={<LegalPage documentKey="distanceSale" />} />
                        <Route path={slugsEn.preInformation} element={<LegalPage documentKey="preInformation" />} />
                        <Route path={slugsEn.corporateB2B} element={<LegalPage documentKey="corporateB2B" />} />
                        <Route path={slugsEn.acceptableUse} element={<LegalPage documentKey="acceptableUse" />} />
                        <Route path={slugsEn.login} element={<Login />} />
                        <Route path={slugsEn.register} element={<Register />} />
                        <Route path={slugsEn.forgotPassword} element={<ForgotPassword />} />
                        <Route path="set-password" element={<SetPassword />} />
                        <Route path={slugsEn.dashboard} element={<Dashboard />} />
                        <Route path={slugsEn.onboardingForm} element={<OnboardingForm />} />
                        <Route path="onboarding-presentation/:orderId" element={<OnboardingPresentation />} />
                        <Route path={slugsEn.checkout} element={<Checkout />} />
                        <Route path={slugsEn.paymentSuccess} element={<PaymentSuccess />} />
                        <Route path={slugsEn.paymentCallback} element={<PaymentCallback />} />
                        <Route path="unsubscribe" element={<UnsubscribePage />} />
                        <Route path="services/:slug" element={<ProductSlugResolver />} />
                        <Route path="sectoral-services/:slug" element={<ProductSlugResolver />} />

                        {/* Backward-compatible EN aliases with legacy Turkish slugs */}
                        <Route path={slugsTr.onboardingForm} element={<RedirectWithQuery to={`/en/${slugsEn.onboardingForm}`} />} />
                        <Route path="hakkimizda" element={<About />} />
                        <Route path="iletisim" element={<ContactPage />} />
                        <Route path="giris" element={<Login />} />
                        <Route path="kayit-ol" element={<Register />} />
                        <Route path="egitimler" element={<Trainings />} />
                        <Route path="egitimler/:id" element={<TrainingProgramPage />} />
                        <Route path="danismanlik" element={<Consulting />} />
                        <Route path="danismanlik/:id" element={<ConsultingProgramPage />} />
                        <Route path="danismanlar" element={<Consultants />} />
                        <Route path="danismanlar/:slug" element={<ConsultantDetail />} />
                        <Route path="hizmetlerimiz/go-to-market-stratejisi" element={<GoToMarket />} />
                        <Route path="hizmetlerimiz/icerik-stratejisi" element={<ContentStrategy />} />
                        <Route path="hizmetlerimiz/butunlesik-dijital-pazarlama" element={<IntegratedDigitalMarketing />} />
                        <Route path="services/b2b-integrated-digital-marketing" element={<B2BIntegratedMarketing />} />
                        <Route path="hizmetlerimiz/google-ads" element={<GoogleAds />} />
                        <Route path="hizmetlerimiz/sosyal-medya-reklamciligi" element={<SocialMediaAds />} />
                        <Route path="hizmetlerimiz/seo-yonetimi" element={<SeoService />} />
                        <Route path="hizmetlerimiz/icerik-uretimi" element={<ContentProduction />} />
                        <Route path="hizmetlerimiz/b2b-email-pazarlama" element={<B2BEmailMarketing />} />
                        <Route path="sektorel-hizmetler/b2b-firmalari-icin-360-pazarlama-yonetimi" element={<B2BThreeSixtyMarketing />} />
                        <Route path="sektorel-hizmetler/odeme-sistemleri-firmalari-icin-360-pazarlama-yonetimi" element={<PaymentSystemsMarketing />} />
                        <Route path="sektorel-hizmetler/endustriyel-gida-sef-cozumleri-firmalari-icin-360-pazarlama-yonetimi" element={<IndustrialFoodMarketing />} />
                        <Route path="sektorel-hizmetler/fintech-firmalari-icin-360-pazarlama-yonetimi" element={<FintechMarketing />} />
                        <Route path="sektorel-hizmetler/teknoloji-yazilim-firmalari-icin-360-pazarlama-yonetimi" element={<SoftwareMarketing />} />
                        <Route path="sektorel-hizmetler/enerji-firmalari-icin-360-pazarlama-yonetimi" element={<EnergyMarketing />} />
                        <Route path="sektorel-hizmetler/ofis-kurumsal-ic-tasarim-firmalari-icin-360-pazarlama-yonetimi" element={<InteriorDesignMarketing />} />
                        <Route path="sektorel-hizmetler/filo-kiralama-firmalari-icin-360-pazarlama-yonetimi" element={<FleetRentalMarketing />} />
                        <Route path="sektorel-hizmetler/uretim-firmalari-icin-360-pazarlama-yonetimi" element={<ManufacturingMarketing />} />
                        <Route path="sektorel-hizmetler/b2b-360-pazarlama-yonetimi" element={<Navigate to={`/en/${slugsEn.sectoralB2B}`} replace />} />
                        <Route path="sektorel-hizmetler/odeme-sistemleri-firmalari-360-pazarlama-yonetimi" element={<Navigate to={`/en/${slugsEn.sectoralPayment}`} replace />} />
                        <Route path="sektorel-hizmetler/endustriyel-gida-sef-cozumleri-firmalari-360-pazarlama-yonetimi" element={<Navigate to={`/en/${slugsEn.sectoralFood}`} replace />} />
                        <Route path="sektorel-hizmetler/fintech-firmalari-360-pazarlama-yonetimi" element={<Navigate to={`/en/${slugsEn.sectoralFintech}`} replace />} />
                        <Route path="sektorel-hizmetler/teknoloji-yazilim-firmalari-360-pazarlama-yonetimi" element={<Navigate to={`/en/${slugsEn.sectoralTech}`} replace />} />
                        <Route path="sektorel-hizmetler/enerji-firmalari-360-pazarlama-yonetimi" element={<Navigate to={`/en/${slugsEn.sectoralEnergy}`} replace />} />
                        <Route path="sektorel-hizmetler/ofis-kurumsal-ic-tasarim-firmalari-360-pazarlama-yonetimi" element={<Navigate to={`/en/${slugsEn.sectoralDesign}`} replace />} />
                        <Route path="sektorel-hizmetler/filo-kiralama-firmalari-360-pazarlama-yonetimi" element={<Navigate to={`/en/${slugsEn.sectoralFleet}`} replace />} />
                        <Route path="sektorel-hizmetler/uretim-firmalari-360-pazarlama-yonetimi" element={<Navigate to={`/en/${slugsEn.sectoralManufacturing}`} replace />} />
                        <Route path="urunler/maestro-ai" element={<MaestroAI />} />
                        <Route path="urunler/maestro-ai-b2b" element={<Navigate to="/en/products/maestro-ai-b2b" replace />} />
                        <Route path="urunler/maestro-ai-odeme-sistemleri" element={<Navigate to="/en/products/maestro-ai-payment-systems" replace />} />
                        <Route path="urunler/maestro-ai-endustriyel-gida" element={<Navigate to="/en/products/maestro-ai-industrial-food" replace />} />
                        <Route path="urunler/maestro-ai-fintech" element={<Navigate to="/en/products/maestro-ai-fintech" replace />} />
                        <Route path="urunler/maestro-ai-enerji" element={<Navigate to="/en/products/maestro-ai-energy" replace />} />
                        <Route path="urunler/maestro-ai-ofis-tasarim" element={<Navigate to="/en/products/maestro-ai-office-design" replace />} />
                        <Route path="urunler/maestro-ai-filo-kiralama" element={<Navigate to="/en/products/maestro-ai-fleet-rental" replace />} />
                        <Route path="urunler/maestro-ai-teknoloji-yazilim" element={<Navigate to="/en/products/maestro-ai-technology-software" replace />} />
                        <Route path="urunler/maestro-ai-uretim" element={<Navigate to="/en/products/maestro-ai-manufacturing" replace />} />
                        <Route path="products/maestro-ai-b2b" element={<MaestroAISector sectorKey="b2b" />} />
                        <Route path="products/maestro-ai-payment-systems" element={<MaestroAISector sectorKey="odeme-sistemleri" />} />
                        <Route path="products/maestro-ai-industrial-food" element={<MaestroAISector sectorKey="endustriyel-gida" />} />
                        <Route path="products/maestro-ai-fintech" element={<MaestroAISector sectorKey="fintech" />} />
                        <Route path="products/maestro-ai-energy" element={<MaestroAISector sectorKey="enerji" />} />
                        <Route path="products/maestro-ai-office-design" element={<MaestroAISector sectorKey="ofis-tasarim" />} />
                        <Route path="products/maestro-ai-fleet-rental" element={<MaestroAISector sectorKey="filo-kiralama" />} />
                        <Route path="products/maestro-ai-technology-software" element={<MaestroAISector sectorKey="teknoloji-yazilim" />} />
                        <Route path="products/maestro-ai-manufacturing" element={<MaestroAISector sectorKey="uretim" />} />
                        <Route path="products/maestro-ai-corporate-gift-card" element={<MaestroAISector sectorKey="hediye-karti" />} />
                        <Route path="products/maestro-ai-corporate-fuel" element={<MaestroAISector sectorKey="akaryakit" />} />
                        <Route path="urunler/eye-tracking-reklam-analizi" element={<EyeTracking />} />
                    </Route>

                    {/* Turkish Routes (Default) */}
                    <Route path="/" element={<Home />} />
                    <Route path="/home" element={<Navigate to="/" replace />} />
                    <Route path="/elementor-696" element={<Navigate to="/" replace />} />
                    <Route path={`/${slugsTr.about}`} element={<About />} />
                    <Route path="/nasil-calisir" element={<Navigate to="/khilonfast-nasil-calisir-hizli-profesyonel-ve-sonuc-odakli-pazarlama-deneyimi" replace />} />
                    <Route path={`/${slugsTr.howItWorks}`} element={<HowItWorks />} />
                    <Route path={`/${slugsTr.gtm}`} element={<GoToMarket />} />
                    <Route path={`/${slugsTr.contentStrategy}`} element={<ContentStrategy />} />
                    <Route path={`/${slugsTr.idm}`} element={<IntegratedDigitalMarketing />} />
                    <Route path="/hizmetlerimiz/b2b-butunlesik-dijital-pazarlama" element={<B2BIntegratedMarketing />} />
                    <Route path="/hizmetlerimiz/fintech-butunlesik-dijital-pazarlama" element={<FintechIntegratedMarketing />} />
                    <Route path="/hizmetlerimiz/uretim-butunlesik-dijital-pazarlama" element={<ManufacturingIntegratedMarketing />} />
                    <Route path="/hizmetlerimiz/enerji-butunlesik-dijital-pazarlama" element={<EnergyIntegratedMarketing />} />
                    <Route path="/hizmetlerimiz/filo-kiralama-butunlesik-dijital-pazarlama" element={<FleetRentalIntegratedMarketing />} />
                    <Route path="/hizmetlerimiz/ofis-tasarim-butunlesik-dijital-pazarlama" element={<InteriorDesignIntegratedMarketing />} />
                    <Route path="/hizmetlerimiz/teknoloji-yazilim-butunlesik-dijital-pazarlama" element={<SoftwareIntegratedMarketing />} />
                    <Route path="/hizmetlerimiz/endustriyel-gida-butunlesik-dijital-pazarlama" element={<IndustrialFoodIntegratedMarketing />} />
                    <Route path="/hizmetlerimiz/odeme-sistemleri-butunlesik-dijital-pazarlama" element={<PaymentSystemsIntegratedMarketing />} />
                    <Route path="/hizmetlerimiz/hediye-karti-butunlesik-dijital-pazarlama" element={<GiftCardIntegratedMarketing />} />
                    <Route path="/hizmetlerimiz/akaryakit-butunlesik-dijital-pazarlama" element={<FuelIntegratedMarketing />} />
                    <Route path={`/${slugsTr.googleAds}`} element={<GoogleAds />} />
                    <Route path={`/${slugsTr.socialAds}`} element={<SocialMediaAds />} />
                    <Route path={`/${slugsTr.seo}`} element={<SeoService />} />
                    <Route path={`/${slugsTr.contentProduction}`} element={<ContentProduction />} />
                    <Route path={`/${slugsTr.b2bEmail}`} element={<B2BEmailMarketing />} />
                    <Route path={`/${slugsTr.sectoralB2B}`} element={<B2BThreeSixtyMarketing />} />
                    <Route path={`/${slugsTr.sectoralPayment}`} element={<PaymentSystemsMarketing />} />
                    <Route path={`/${slugsTr.sectoralFood}`} element={<IndustrialFoodMarketing />} />
                    <Route path={`/${slugsTr.sectoralFintech}`} element={<FintechMarketing />} />
                    <Route path={`/${slugsTr.sectoralTech}`} element={<SoftwareMarketing />} />
                    <Route path={`/${slugsTr.sectoralEnergy}`} element={<EnergyMarketing />} />
                    <Route path={`/${slugsTr.sectoralDesign}`} element={<InteriorDesignMarketing />} />
                    <Route path={`/${slugsTr.sectoralFleet}`} element={<FleetRentalMarketing />} />
                    <Route path={`/${slugsTr.sectoralManufacturing}`} element={<ManufacturingMarketing />} />
                    <Route path={`/${slugsTr.sectoralGiftCard}`} element={<GiftCardMarketing />} />
                    <Route path={`/${slugsTr.sectoralFuel}`} element={<FuelMarketing />} />
                    <Route path="/sektorel-hizmetler/b2b-360-pazarlama-yonetimi" element={<Navigate to={`/${slugsTr.sectoralB2B}`} replace />} />
                    <Route path="/sektorel-hizmetler/odeme-sistemleri-firmalari-360-pazarlama-yonetimi" element={<Navigate to={`/${slugsTr.sectoralPayment}`} replace />} />
                    <Route path="/sektorel-hizmetler/endustriyel-gida-sef-cozumleri-firmalari-360-pazarlama-yonetimi" element={<Navigate to={`/${slugsTr.sectoralFood}`} replace />} />
                    <Route path="/sektorel-hizmetler/fintech-firmalari-360-pazarlama-yonetimi" element={<Navigate to={`/${slugsTr.sectoralFintech}`} replace />} />
                    <Route path="/sektorel-hizmetler/teknoloji-yazilim-firmalari-360-pazarlama-yonetimi" element={<Navigate to={`/${slugsTr.sectoralTech}`} replace />} />
                    <Route path="/sektorel-hizmetler/enerji-firmalari-360-pazarlama-yonetimi" element={<Navigate to={`/${slugsTr.sectoralEnergy}`} replace />} />
                    <Route path="/sektorel-hizmetler/ofis-kurumsal-ic-tasarim-firmalari-360-pazarlama-yonetimi" element={<Navigate to={`/${slugsTr.sectoralDesign}`} replace />} />
                    <Route path="/sektorel-hizmetler/filo-kiralama-firmalari-360-pazarlama-yonetimi" element={<Navigate to={`/${slugsTr.sectoralFleet}`} replace />} />
                    <Route path="/sektorel-hizmetler/uretim-firmalari-360-pazarlama-yonetimi" element={<Navigate to={`/${slugsTr.sectoralManufacturing}`} replace />} />
                    <Route path="/hizmetlerimiz/buyume-odakli-pazarlama-egitimi" element={<Navigate to="/egitimler/buyume-odakli-pazarlama-egitimi" replace />} />
                    <Route path="/courses/odeme-sistemlerinde-buyume-odakli-pazarlama" element={<Navigate to="/egitimler/odeme-sistemlerinde-buyume-odakli-pazarlama-egitimi" replace />} />
                    <Route path="/odeme-sistemlerinde-buyume-odakli-pazarlama-egitimi" element={<Navigate to="/egitimler/odeme-sistemlerinde-buyume-odakli-pazarlama-egitimi" replace />} />
                    <Route path="/b2b-sektorunde-buyume-odakli-pazarlama-egitimi" element={<Navigate to="/egitimler/b2b-sektorunde-buyume-odakli-pazarlama-egitimi" replace />} />
                    <Route path="/fintech-sektorunde-buyume-odakli-pazarlama-egitimi" element={<Navigate to="/egitimler/fintech-sektorunde-buyume-odakli-pazarlama-egitimi" replace />} />
                    <Route path="/teknoloji-yazilim-sektorunde-buyume-odakli-pazarlama-egitimi" element={<Navigate to="/egitimler/teknoloji-yazilim-sektorunde-buyume-odakli-pazarlama-egitimi" replace />} />
                    <Route path="/uretim-sektorunde-buyume-odakli-pazarlama-egitimi" element={<Navigate to="/egitimler/uretim-sektorunde-buyume-odakli-pazarlama-egitimi" replace />} />
                    <Route path="/enerji-sektorunde-buyume-odakli-pazarlama-egitimi" element={<Navigate to="/egitimler/enerji-sektorunde-buyume-odakli-pazarlama-egitimi" replace />} />
                    <Route path="/ofis-kurumsal-ic-tasarim-sektorunde-buyume-odakli-pazarlama-egitimi" element={<Navigate to="/egitimler/ofis-kurumsal-ic-tasarim-sektorunde-buyume-odakli-pazarlama-egitimi" replace />} />
                    <Route path="/filo-kiralama-sektorunde-buyume-odakli-pazarlama-egitimi" element={<Navigate to="/egitimler/filo-kiralama-sektorunde-buyume-odakli-pazarlama-egitimi" replace />} />
                    <Route path="/endustriyel-gida-sektorunde-buyume-odakli-pazarlama-egitimi" element={<Navigate to="/egitimler/endustriyel-gida-sektorunde-buyume-odakli-pazarlama-egitimi" replace />} />
                    <Route path="/endustriyel-gida-sektorunde-buyume-odakli-pazarlama-egitimi-copy" element={<Navigate to="/endustriyel-gida-sektorunde-buyume-odakli-pazarlama-egitimi" replace />} />
                    <Route path={`/${slugsTr.maestro}`} element={<MaestroAI />} />
                    <Route path="/urunler/maestro-ai-b2b" element={<MaestroAISector sectorKey="b2b" />} />
                    <Route path="/urunler/maestro-ai-odeme-sistemleri" element={<MaestroAISector sectorKey="odeme-sistemleri" />} />
                    <Route path="/urunler/maestro-ai-endustriyel-gida" element={<MaestroAISector sectorKey="endustriyel-gida" />} />
                    <Route path="/urunler/maestro-ai-fintech" element={<MaestroAISector sectorKey="fintech" />} />
                    <Route path="/urunler/maestro-ai-enerji" element={<MaestroAISector sectorKey="enerji" />} />
                    <Route path="/urunler/maestro-ai-ofis-tasarim" element={<MaestroAISector sectorKey="ofis-tasarim" />} />
                    <Route path="/urunler/maestro-ai-filo-kiralama" element={<MaestroAISector sectorKey="filo-kiralama" />} />
                    <Route path="/urunler/maestro-ai-teknoloji-yazilim" element={<MaestroAISector sectorKey="teknoloji-yazilim" />} />
                    <Route path="/urunler/maestro-ai-uretim" element={<MaestroAISector sectorKey="uretim" />} />
                    <Route path="/urunler/maestro-ai-hediye-karti" element={<MaestroAISector sectorKey="hediye-karti" />} />
                    <Route path="/urunler/maestro-ai-akaryakit" element={<MaestroAISector sectorKey="akaryakit" />} />
                    <Route path="/hizmetlerimiz/maestro-ai" element={<Navigate to="/urunler/maestro-ai" replace />} />
                    <Route path="/b2b-pazarlama-stratejinizi-maestro-ai-ile-yonetin-copy" element={<Navigate to="/urunler/maestro-ai" replace />} />
                    <Route path="/hizmetlerimiz/eye-tracking-reklam-analizi" element={<Navigate to="/urunler/eye-tracking-reklam-analizi" replace />} />
                    <Route path="/hizmetler/eye-tracking-reklam-analizi" element={<Navigate to="/urunler/eye-tracking-reklam-analizi" replace />} />
                    <Route path={`/${slugsTr.eyeTracking}`} element={<EyeTracking />} />
                    <Route path="/hizmetlerimiz/google-search-console-kurulum-akisi" element={<SearchConsoleSetup />} />
                    <Route path="/butunlesik-pazarlama-kurulum-akisi" element={<IntegratedMarketingSetupFlow />} />
                    {setupFlows.map((flow) => (
                        <Route key={flow.path} path={flow.path} element={<SetupFlowPage path={flow.path} />} />
                    ))}
                    <Route path={`/${slugsTr.trainings}`} element={<Trainings />} />
                    <Route path={`/${slugsTr.trainings}/:id`} element={<TrainingProgramPage />} />
                    {trainingPrograms.map((program) => (
                        <Route key={program.path} path={program.path} element={<TrainingProgramPage />} />
                    ))}
                    <Route path={`/${slugsTr.consulting}`} element={<Consulting />} />
                    <Route path={`/${slugsTr.consulting}/:id`} element={<ConsultingProgramPage />} />
                    {consultingPrograms.map((program) => (
                        <Route key={program.path} path={program.path} element={<ConsultingProgramPage />} />
                    ))}
                    <Route path="/danismanlar" element={<Consultants />} />
                    <Route path="/danismanlar/:slug" element={<ConsultantDetail />} />

                    {/* Auth & Cart Routes */}
                    <Route path={`/${slugsTr.login}`} element={<Login />} />
                    <Route path={`/${slugsTr.contact}`} element={<ContactPage />} />
                    <Route path={`/${slugsTr.privacyPolicy}`} element={<LegalPage documentKey="privacyPolicy" />} />
                    <Route path={`/${slugsTr.cookiePolicy}`} element={<LegalPage documentKey="cookiePolicy" />} />
                    <Route path={`/${slugsTr.termsOfService}`} element={<LegalPage documentKey="termsOfService" />} />
                    <Route path={`/${slugsTr.refundPolicy}`} element={<LegalPage documentKey="refundPolicy" />} />
                    <Route path={`/${slugsTr.distanceSale}`} element={<LegalPage documentKey="distanceSale" />} />
                    <Route path={`/${slugsTr.preInformation}`} element={<LegalPage documentKey="preInformation" />} />
                    <Route path={`/${slugsTr.corporateB2B}`} element={<LegalPage documentKey="corporateB2B" />} />
                    <Route path={`/${slugsTr.acceptableUse}`} element={<LegalPage documentKey="acceptableUse" />} />
                    <Route path={`/${slugsTr.register}`} element={<Register />} />
                    <Route path="/kayit-ol" element={<Register />} />
                    <Route path={`/${slugsTr.forgotPassword}`} element={<ForgotPassword />} />
                    <Route path="/sifre-belirle" element={<SetPassword />} />
                    <Route path="/login" element={<Navigate to="/giris" replace />} />
                    <Route path="/register" element={<Navigate to="/kayit-ol" replace />} />
                    <Route path={`/${slugsTr.checkout}`} element={<Checkout />} />
                    <Route path="/danismanlik-odeme/:bookingId" element={<DanismanlikOdeme />} />
                    <Route path="/danismanlik/randevu/:bookingId" element={<DanismanlikRandevu />} />
                    <Route path={`/${slugsTr.paymentSuccess}`} element={<PaymentSuccess />} />
                    <Route path={`/${slugsTr.paymentCallback}`} element={<PaymentCallback />} />
                    <Route path="/abonelikten-cik" element={<UnsubscribePage />} />
                    <Route path={`/${slugsTr.dashboard}`} element={<Dashboard />} />
                    {/* ASCII alias — mail/SMS gibi yerlerde Türkçe karakter URL-encode olunca 404 olmasın */}
                    <Route path="/hesabim" element={<Dashboard />} />
                    <Route path={`/${slugsTr.onboardingForm}`} element={<OnboardingForm />} />
                    <Route path="/onboarding-sunumu/:orderId" element={<OnboardingPresentation />} />
                    <Route path="/hizmetlerimiz/:slug" element={<ProductSlugResolver />} />
                    <Route path="/sektorel-hizmetler/:slug" element={<ProductSlugResolver />} />

                    {/* Admin Routes */}
                    <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                    <Route path="/admin/settings" element={<RequireAdmin><SettingsPage /></RequireAdmin>} />
                    <Route path="/admin/products" element={<RequireAdmin><ProductList /></RequireAdmin>} />
                    <Route path="/admin/products/new" element={<RequireAdmin><ProductEditor /></RequireAdmin>} />
                    <Route path="/admin/products/edit/:id" element={<RequireAdmin><ProductEditor /></RequireAdmin>} />
                    <Route path="/admin/pages" element={<RequireAdmin><PagesList /></RequireAdmin>} />
                    <Route path="/admin/pages/new" element={<RequireAdmin><PageBuilder /></RequireAdmin>} />
                    <Route path="/admin/pages/edit/:id" element={<RequireAdmin><PageBuilder /></RequireAdmin>} />
                    <Route path="/admin/training-pages/*" element={<RequireAdmin><TrainingContentEditor /></RequireAdmin>} />
                    <Route path="/admin/users" element={<RequireAdmin><UsersPage /></RequireAdmin>} />
                    <Route path="/admin/consultants" element={<RequireAdmin><ConsultantList /></RequireAdmin>} />
                    <Route path="/admin/consultants/new" element={<RequireAdmin><ConsultantEditor /></RequireAdmin>} />
                    <Route path="/admin/consultants/:id" element={<RequireAdmin><ConsultantEditor /></RequireAdmin>} />
                    <Route path="/admin/bookings" element={<RequireAdmin><BookingList /></RequireAdmin>} />
                    <Route path="/admin/invoices" element={<RequireAdmin><InvoicesList /></RequireAdmin>} />
                    <Route path="/admin/invoices/:orderId" element={<RequireAdmin><InvoiceDetail /></RequireAdmin>} />
                    <Route path="/admin/training-analytics" element={<RequireAdmin><TrainingAnalytics /></RequireAdmin>} />
                    <Route path="/admin/training-content" element={<RequireAdmin><TrainingAccessPages /></RequireAdmin>} />
                    <Route path="/admin/coupons" element={<RequireAdmin><CouponList /></RequireAdmin>} />
                    <Route path="/admin/bank-accounts" element={<RequireAdmin><BankAccountsAdmin /></RequireAdmin>} />
                    <Route path="/admin/manual-bank-accounts" element={<RequireAdmin><ManualBankAccountsAdmin /></RequireAdmin>} />
                    <Route path="/admin/manual-orders" element={<RequireAdmin><ManualOrdersAdmin /></RequireAdmin>} />
                    <Route path="/admin/onboarding-forms" element={<RequireAdmin><OnboardingFormsList /></RequireAdmin>} />
                    <Route path="/admin/eye-tracking-uploads" element={<RequireAdmin><EyeTrackingUploadsList /></RequireAdmin>} />
                    <Route path="/admin/subscriptions" element={<RequireAdmin><AdminSubscriptions /></RequireAdmin>} />
                    <Route path="/admin/email-automation" element={<RequireAdmin><EmailAutomation /></RequireAdmin>} />
                    <Route path="/admin/automations" element={<RequireAdmin><AutomationListPage /></RequireAdmin>} />
                    <Route path="/admin/automations/:id/executions" element={<RequireAdmin><ExecutionsPage /></RequireAdmin>} />
                    <Route path="/admin/automations/:id" element={<RequireAdmin><AutomationBuilderPage /></RequireAdmin>} />
                    <Route path="/admin/email-templates" element={<RequireAdmin><EmailTemplatesPage /></RequireAdmin>} />
                    <Route path="/admin/automation-logs" element={<RequireAdmin><AutomationLogsPage /></RequireAdmin>} />
                    <Route path="/admin/automation-test" element={<RequireAdmin><AutomationTestPage /></RequireAdmin>} />

                    {/* CRM (Faz 1-9) */}
                    <Route path="/admin/crm" element={<RequireAdmin><CrmDashboardPage /></RequireAdmin>} />
                    <Route path="/admin/crm/dashboard" element={<RequireAdmin><CrmDashboardPage /></RequireAdmin>} />
                    <Route path="/admin/crm/funnels" element={<RequireAdmin><CrmFunnelsPage /></RequireAdmin>} />
                    <Route path="/admin/crm/contacts" element={<RequireAdmin><CrmContactsPage /></RequireAdmin>} />
                    <Route path="/admin/crm/contacts/:id" element={<RequireAdmin><CrmContactDetailPage /></RequireAdmin>} />
                    <Route path="/admin/crm/tags" element={<RequireAdmin><CrmTagsPage /></RequireAdmin>} />
                    <Route path="/admin/crm/lists" element={<RequireAdmin><CrmListsPage /></RequireAdmin>} />
                    <Route path="/admin/crm/lists/:id" element={<RequireAdmin><CrmListDetailPage /></RequireAdmin>} />
                    <Route path="/admin/crm/custom-fields" element={<RequireAdmin><CrmCustomFieldsPage /></RequireAdmin>} />
                    <Route path="/admin/crm/scoring-rules" element={<RequireAdmin><CrmScoringRulesPage /></RequireAdmin>} />
                    <Route path="/admin/crm/smart-links" element={<RequireAdmin><CrmSmartLinksPage /></RequireAdmin>} />
                    <Route path="/admin/crm/campaigns" element={<RequireAdmin><CrmCampaignsPage /></RequireAdmin>} />
                    <Route path="/admin/crm/campaigns/:id" element={<RequireAdmin><CrmCampaignDetailPage /></RequireAdmin>} />
                    <Route path="/admin/crm/forms" element={<RequireAdmin><CrmFormsPage /></RequireAdmin>} />
                    <Route path="/admin/crm/forms/:id" element={<RequireAdmin><CrmFormDetailPage /></RequireAdmin>} />
                    <Route path="/admin/crm/import" element={<RequireAdmin><CrmImportPage /></RequireAdmin>} />

                    {/* Training Content Routes */}
                    <Route path="/egitimllerim/:slug" element={<TrainingContentPage />} />
                    <Route path="/en/egitimllerim/:slug" element={<TrainingContentPage />} />

                    <Route path="*" element={<LegacyWordpressPage />} />
                </Routes>
                </Suspense>
            </main>
            {!isAdminRoute && !isLegacyRoute && !isPlayerRoute && <Footer />}
            {!isAdminRoute && !isLegacyRoute && !isPlayerRoute && <CookieConsent />}
        </>
    );
}

function App() {
    return (
        <Router>
            <ConsentProvider>
                <AuthProvider>
                    <CartProvider>
                        <CurrencyConflictModal />
                        <MainContent />
                    </CartProvider>
                </AuthProvider>
            </ConsentProvider>
        </Router>
    )
}

export default App
