import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
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

function App() {
    return (
        <Router>
            <ScrollToTop />
            <Header />
            <main>
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
                    <Route path="/hizmetlerimiz/maestro-ai" element={<MaestroAI />} />
                    <Route path="/hizmetlerimiz/eye-tracking-reklam-analizi" element={<EyeTracking />} />
                    <Route path="/hizmetlerimiz/google-search-console-kurulum-akisi" element={<SearchConsoleSetup />} />
                </Routes>
            </main>
            <Footer />
        </Router>
    )
}

export default App
