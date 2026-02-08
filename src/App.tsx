import { BrowserRouter as Router, Routes, Route, useLocation, matchPath } from 'react-router-dom'
import './App.css'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import Header from './components/Header'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
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
import GrowthMarketingTraining from './pages/GrowthMarketingTraining'
import MaestroAI from './pages/MaestroAI'
import EyeTracking from './pages/EyeTracking'
import SearchConsoleSetup from './pages/SearchConsoleSetup'
import SetupFlowPage from './pages/SetupFlowPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Checkout from './pages/Checkout'
import PaymentSuccess from './pages/PaymentSuccess'
import Dashboard from './pages/Dashboard'
import Trainings from './pages/Trainings'
import TrainingProgramPage from './pages/TrainingProgramPage'
import LegacyWordpressPage from './pages/LegacyWordpressPage'
import { trainingPrograms } from './data/trainingPrograms'
import { productPrograms } from './data/productPrograms'
import { setupFlows } from './data/setupFlows'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import SettingsPage from './pages/admin/Settings'
import PagesList from './pages/admin/Pages'
import PageBuilder from './pages/admin/PageBuilder'
import ProductList from './pages/admin/ProductList'
import ProductEditor from './pages/admin/ProductEditor'

function MainContent() {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');
    const knownRoutePatterns = [
        '/',
        '/hakkimizda',
        '/hizmetlerimiz/go-to-market-stratejisi',
        '/hizmetlerimiz/icerik-stratejisi',
        '/hizmetlerimiz/butunlesik-dijital-pazarlama',
        '/hizmetlerimiz/google-ads',
        '/hizmetlerimiz/sosyal-medya-reklamciligi',
        '/hizmetlerimiz/seo-yonetimi',
        '/hizmetlerimiz/icerik-uretimi',
        '/hizmetlerimiz/b2b-email-pazarlama',
        '/sektorel-hizmetler/b2b-360-pazarlama-yonetimi',
        '/sektorel-hizmetler/odeme-sistemleri-pazarlama-yonetimi',
        '/sektorel-hizmetler/endustriyel-gida-sef-cozumleri-pazarlama-yonetimi',
        '/sektorel-hizmetler/fintech-360-pazarlama-yonetimi',
        '/sektorel-hizmetler/teknoloji-yazilim-360-pazarlama-yonetimi',
        '/sektorel-hizmetler/enerji-firmalari-360-pazarlama-yonetimi',
        '/sektorel-hizmetler/ofis-kurumsal-ic-tasarim-360-pazarlama-yonetimi',
        '/sektorel-hizmetler/filo-kiralama-firmalari-360-pazarlama-yonetimi',
        '/sektorel-hizmetler/uretim-sektoru-firmalari-360-pazarlama-yonetimi',
        '/hizmetlerimiz/buyume-odakli-pazarlama-egitimi',
        '/hizmetlerimiz/maestro-ai',
        '/hizmetlerimiz/eye-tracking-reklam-analizi',
        '/b2b-pazarlama-stratejinizi-maestro-ai-ile-yonetin-copy',
        '/hizmetler/eye-tracking-reklam-analizi',
        '/hizmetlerimiz/google-search-console-kurulum-akisi',
        ...setupFlows.map((flow) => flow.path),
        '/egitimler',
        '/login',
        '/register',
        '/checkout',
        '/payment-success',
        '/dashboard',
        '/admin',
        '/admin/settings',
        '/admin/pages',
        '/admin/pages/new',
        '/admin/pages/edit/:id',
        '/admin/products',
        '/admin/products/new',
        '/admin/products/edit/:id',
        ...trainingPrograms.map((program) => program.path),
        ...productPrograms.map((product) => product.path)
    ];
    const isKnownRoute = knownRoutePatterns.some((pattern) =>
        Boolean(matchPath({ path: pattern, end: true }, location.pathname))
    );
    const isLegacyRoute = !isAdminRoute && !isKnownRoute;

    return (
        <>
            <ScrollToTop />
            {!isAdminRoute && !isLegacyRoute && <Header />}
            <main className={isAdminRoute ? 'admin-main' : isLegacyRoute ? 'legacy-main' : ''}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/hakkimizda" element={<About />} />
                    <Route path="/hizmetlerimiz/go-to-market-stratejisi" element={<GoToMarket />} />
                    <Route path="/hizmetlerimiz/icerik-stratejisi" element={<ContentStrategy />} />
                    <Route path="/hizmetlerimiz/butunlesik-dijital-pazarlama" element={<IntegratedDigitalMarketing />} />
                    <Route path="/hizmetlerimiz/google-ads" element={<GoogleAds />} />
                    <Route path="/hizmetlerimiz/sosyal-medya-reklamciligi" element={<SocialMediaAds />} />
                    <Route path="/hizmetlerimiz/seo-yonetimi" element={<SeoService />} />
                    <Route path="/hizmetlerimiz/icerik-uretimi" element={<ContentProduction />} />
                    <Route path="/hizmetlerimiz/b2b-email-pazarlama" element={<B2BEmailMarketing />} />
                    <Route path="/sektorel-hizmetler/b2b-360-pazarlama-yonetimi" element={<B2BThreeSixtyMarketing />} />
                    <Route path="/sektorel-hizmetler/odeme-sistemleri-pazarlama-yonetimi" element={<PaymentSystemsMarketing />} />
                    <Route path="/sektorel-hizmetler/endustriyel-gida-sef-cozumleri-pazarlama-yonetimi" element={<IndustrialFoodMarketing />} />
                    <Route path="/sektorel-hizmetler/fintech-360-pazarlama-yonetimi" element={<FintechMarketing />} />
                    <Route path="/sektorel-hizmetler/teknoloji-yazilim-360-pazarlama-yonetimi" element={<SoftwareMarketing />} />
                    <Route path="/sektorel-hizmetler/enerji-firmalari-360-pazarlama-yonetimi" element={<EnergyMarketing />} />
                    <Route path="/sektorel-hizmetler/ofis-kurumsal-ic-tasarim-360-pazarlama-yonetimi" element={<InteriorDesignMarketing />} />
                    <Route path="/sektorel-hizmetler/filo-kiralama-firmalari-360-pazarlama-yonetimi" element={<FleetRentalMarketing />} />
                    <Route path="/sektorel-hizmetler/uretim-sektoru-firmalari-360-pazarlama-yonetimi" element={<ManufacturingMarketing />} />
                    <Route path="/hizmetlerimiz/buyume-odakli-pazarlama-egitimi" element={<GrowthMarketingTraining />} />
                    <Route path="/b2b-sektorunde-buyume-odakli-pazarlama-egitimi" element={<GrowthMarketingTraining />} />
                    <Route path="/hizmetlerimiz/maestro-ai" element={<MaestroAI />} />
                    <Route path="/b2b-pazarlama-stratejinizi-maestro-ai-ile-yonetin-copy" element={<MaestroAI />} />
                    <Route path="/hizmetlerimiz/eye-tracking-reklam-analizi" element={<EyeTracking />} />
                    <Route path="/hizmetler/eye-tracking-reklam-analizi" element={<EyeTracking />} />
                    <Route path="/hizmetlerimiz/google-search-console-kurulum-akisi" element={<SearchConsoleSetup />} />
                    {setupFlows.map((flow) => (
                        <Route key={flow.path} path={flow.path} element={<SetupFlowPage path={flow.path} />} />
                    ))}
                    <Route path="/egitimler" element={<Trainings />} />
                    {trainingPrograms
                        .filter((program) =>
                            program.path !== '/hizmetlerimiz/buyume-odakli-pazarlama-egitimi' &&
                            program.path !== '/b2b-sektorunde-buyume-odakli-pazarlama-egitimi'
                        )
                        .map((program) => (
                        <Route key={program.path} path={program.path} element={<TrainingProgramPage />} />
                    ))}

                    {/* Auth & Cart Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/payment-success" element={<PaymentSuccess />} />
                    <Route path="/dashboard" element={<Dashboard />} />

                    {/* Admin Routes */}
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/settings" element={<SettingsPage />} />
                    <Route path="/admin/pages" element={<PagesList />} />
                    <Route path="/admin/pages/new" element={<PageBuilder />} />
                    <Route path="/admin/pages/edit/:id" element={<PageBuilder />} />
                    <Route path="/admin/products" element={<ProductList />} />
                    <Route path="/admin/products/new" element={<ProductEditor />} />
                    <Route path="/admin/products/edit/:id" element={<ProductEditor />} />
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
