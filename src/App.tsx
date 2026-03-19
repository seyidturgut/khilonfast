import { useLayoutEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, matchPath, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ReactElement } from 'react'
import './App.css'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'
import Header from './components/Header'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import SeoHead from './components/SeoHead'
import Home from './pages/Home'
import GoToMarket from './pages/GoToMarket'
import ContentStrategy from './pages/ContentStrategy'
import IntegratedDigitalMarketing from './pages/IntegratedDigitalMarketing'
import GoogleAds from './pages/GoogleAds'
import SocialMediaAds from './pages/SocialMediaAds'
import SeoService from './pages/SeoService'
import ContentProduction from './pages/ContentProduction'
import B2BEmailMarketing from './pages/B2BEmailMarketing'
import B2BThreeSixtyMarketing from './pages/B2BThreeSixtyMarketing'
import PaymentSystemsMarketing from './pages/PaymentSystemsMarketing'
import IndustrialFoodMarketing from './pages/IndustrialFoodMarketing'
import FintechMarketing from './pages/FintechMarketing'
import SoftwareMarketing from './pages/SoftwareMarketing'
import EnergyMarketing from './pages/EnergyMarketing'
import InteriorDesignMarketing from './pages/InteriorDesignMarketing'
import FleetRentalMarketing from './pages/FleetRentalMarketing'
import ManufacturingMarketing from './pages/ManufacturingMarketing'
import About from './pages/About'
import HowItWorks from './pages/HowItWorks'
import MaestroAI from './pages/MaestroAI'
import MaestroAISector from './pages/MaestroAISector'
import EyeTracking from './pages/EyeTracking'
import SearchConsoleSetup from './pages/SearchConsoleSetup'
import SetupFlowPage from './pages/SetupFlowPage'
import IntegratedMarketingSetupFlow from './pages/IntegratedMarketingSetupFlow'
import ContactPage from './pages/ContactPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Checkout from './pages/Checkout'
import PaymentSuccess from './pages/PaymentSuccess'
import PaymentCallback from './pages/PaymentCallback'
import Dashboard from './pages/Dashboard'
import Trainings from './pages/Trainings'
import TrainingProgramPage from './pages/TrainingProgramPage'
import Consulting from './pages/Consulting'
import ConsultingProgramPage from './pages/ConsultingProgramPage'
import LegacyWordpressPage from './pages/LegacyWordpressPage'
import ProductSlugResolver from './pages/ProductSlugResolver'
import { trainingPrograms } from './data/trainingPrograms'
import { consultingPrograms } from './data/consultingPrograms'
import { productPrograms } from './data/productPrograms'
import { setupFlows } from './data/setupFlows'
import { resolveLocaleFromPath } from './utils/locale'
import trCommon from './locales/tr/common.json'
import enCommon from './locales/en/common.json'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import SettingsPage from './pages/admin/Settings'
import ProductList from './pages/admin/ProductList'
import ProductEditor from './pages/admin/ProductEditor'
import UsersPage from './pages/admin/Users'
import PagesList from './pages/admin/Pages'
import PageBuilder from './pages/admin/PageBuilder'
import TrainingContentEditor from './pages/admin/TrainingContentEditor'

const slugsTr = trCommon.slugs as Record<string, string>
const slugsEn = enCommon.slugs as Record<string, string>
const slugValuesTr = Object.values(slugsTr).filter(Boolean)
const slugValuesEn = Object.values(slugsEn).filter(Boolean)

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
    const knownRoutePatterns = [
        '/',
        '/hakkimizda',
        '/nasil-calisir',
        '/khilonfast-nasil-calisir-hizli-profesyonel-ve-sonuc-odakli-pazarlama-deneyimi',
        '/hizmetlerimiz/go-to-market-stratejisi',
        '/hizmetlerimiz/icerik-stratejisi',
        '/hizmetlerimiz/butunlesik-dijital-pazarlama',
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
        '/hizmetlerimiz/eye-tracking-reklam-analizi',
        '/b2b-pazarlama-stratejinizi-maestro-ai-ile-yonetin-copy',
        '/hizmetler/eye-tracking-reklam-analizi',
        '/hizmetlerimiz/google-search-console-kurulum-akisi',
        '/butunlesik-pazarlama-kurulum-akisi',
        ...setupFlows.map((flow) => flow.path),
        '/egitimler',
        '/giris',
        '/iletisim',
        '/kayil-ol',
        '/login',
        '/register',
        '/checkout',
        '/payment-success',
        '/payment-callback',
        '/dashboard',
        '/admin',
        '/admin/settings',
        '/admin/products',
        '/admin/products/new',
        '/admin/products/edit/:id',
        '/admin/users',
        ...slugValuesTr.map((slug) => `/${slug}`),
        ...slugValuesEn.map((slug) => `/${slug}`),
        ...trainingPrograms.map((program) => program.path),
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

    return (
        <>
            <SeoHead />
            <ScrollToTop />
            {!isAdminRoute && !isLegacyRoute && <Header />}
            <main
                key={`lang-${routeLang}`}
                className={isAdminRoute ? 'admin-main' : isLegacyRoute ? 'legacy-main' : ''}
            >
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
                        <Route path={slugsEn.gtm} element={<GoToMarket />} />
                        <Route path={slugsEn.contentStrategy} element={<ContentStrategy />} />
                        <Route path={slugsEn.idm} element={<IntegratedDigitalMarketing />} />
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
                        <Route path={slugsEn.maestro} element={<MaestroAI />} />
                        <Route path={slugsEn.eyeTracking} element={<EyeTracking />} />
                        <Route path={slugsEn.contact} element={<ContactPage />} />
                        <Route path={slugsEn.login} element={<Login />} />
                        <Route path={slugsEn.register} element={<Register />} />
                        <Route path={slugsEn.dashboard} element={<Dashboard />} />
                        <Route path={slugsEn.checkout} element={<Checkout />} />
                        <Route path={slugsEn.paymentSuccess} element={<PaymentSuccess />} />
                        <Route path={slugsEn.paymentCallback} element={<PaymentCallback />} />
                        <Route path="services/:slug" element={<ProductSlugResolver />} />
                        <Route path="sectoral-services/:slug" element={<ProductSlugResolver />} />

                        {/* Backward-compatible EN aliases with legacy Turkish slugs */}
                        <Route path="hakkimizda" element={<About />} />
                        <Route path="iletisim" element={<ContactPage />} />
                        <Route path="giris" element={<Login />} />
                        <Route path="kayil-ol" element={<Register />} />
                        <Route path="egitimler" element={<Trainings />} />
                        <Route path="egitimler/:id" element={<TrainingProgramPage />} />
                        <Route path="danismanlik" element={<Consulting />} />
                        <Route path="danismanlik/:id" element={<ConsultingProgramPage />} />
                        <Route path="hizmetlerimiz/go-to-market-stratejisi" element={<GoToMarket />} />
                        <Route path="hizmetlerimiz/icerik-stratejisi" element={<ContentStrategy />} />
                        <Route path="hizmetlerimiz/butunlesik-dijital-pazarlama" element={<IntegratedDigitalMarketing />} />
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
                        <Route path="urunler/maestro-ai-b2b" element={<MaestroAISector sectorKey="b2b" />} />
                        <Route path="urunler/maestro-ai-odeme-sistemleri" element={<MaestroAISector sectorKey="odeme-sistemleri" />} />
                        <Route path="urunler/maestro-ai-endustriyel-gida" element={<MaestroAISector sectorKey="endustriyel-gida" />} />
                        <Route path="urunler/maestro-ai-fintech" element={<MaestroAISector sectorKey="fintech" />} />
                        <Route path="urunler/maestro-ai-enerji" element={<MaestroAISector sectorKey="enerji" />} />
                        <Route path="urunler/maestro-ai-ofis-tasarim" element={<MaestroAISector sectorKey="ofis-tasarim" />} />
                        <Route path="urunler/maestro-ai-filo-kiralama" element={<MaestroAISector sectorKey="filo-kiralama" />} />
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

                    {/* Auth & Cart Routes */}
                    <Route path={`/${slugsTr.login}`} element={<Login />} />
                    <Route path={`/${slugsTr.contact}`} element={<ContactPage />} />
                    <Route path={`/${slugsTr.register}`} element={<Register />} />
                    <Route path="/login" element={<Navigate to="/giris" replace />} />
                    <Route path="/register" element={<Navigate to="/kayil-ol" replace />} />
                    <Route path={`/${slugsTr.checkout}`} element={<Checkout />} />
                    <Route path={`/${slugsTr.paymentSuccess}`} element={<PaymentSuccess />} />
                    <Route path={`/${slugsTr.paymentCallback}`} element={<PaymentCallback />} />
                    <Route path={`/${slugsTr.dashboard}`} element={<Dashboard />} />
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
                    <Route path="*" element={<LegacyWordpressPage />} />
                </Routes>
            </main>
            {!isAdminRoute && !isLegacyRoute && <Footer />}
        </>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <CartProvider>
                    <MainContent />
                </CartProvider>
            </AuthProvider>
        </Router>
    )
}

export default App
