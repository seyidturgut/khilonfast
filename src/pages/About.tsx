import { HiRocketLaunch, HiChartBar, HiMagnifyingGlass, HiSparkles, HiCommandLine, HiXMark } from 'react-icons/hi2'
import './About.css'

export default function About() {
    return (
        <div className="about-page">
            {/* Hero Section */}
            <section className="about-hero">
                <div className="container">
                    <div className="about-hero-content">
                        <h1 className="about-hero-title">İşletmenizin Potansiyelini <br /><span>Ortaya Çıkarın!</span></h1>
                        <p className="about-hero-description">
                            khilonfast ile işinizi büyütün, dijital dünyada fark yaratın. Pazara girişten satışa,
                            verimli büyümeye kadar dijital dünyada yanınızdayız.
                        </p>
                        <a href="/hizmetlerimiz/butunlesik-dijital-pazarlama" className="btn btn-white">Keşfet</a>
                    </div>
                </div>
                <div className="about-hero-bg-accent"></div>
            </section>

            {/* Who is khilonfast Section */}
            <section className="about-who">
                <div className="container">
                    <div className="about-grid reverse">
                        <div className="about-text-content">
                            <h2 className="section-title">khilonfast kimdir?</h2>
                            <p className="section-description">
                                khilonfast, dijital pazarlama alanında uzmanlaşmış, sonuç odaklı bir büyüme ajansıdır.
                                B2B ve teknoloji odaklı işletmelerin karmaşık pazarlama süreçlerini basitleştirerek
                                sürdürülebilir büyüme sağlıyoruz.
                            </p>
                            <div className="about-features-list">
                                <div className="feature-item">
                                    <div className="feature-icon"><HiRocketLaunch /></div>
                                    <div className="feature-text">
                                        <h4>Stratejik Planlama</h4>
                                        <p>Şirketlerin pazarda doğru konumlanmasını sağlıyoruz.</p>
                                    </div>
                                </div>
                                <div className="feature-item">
                                    <div className="feature-icon"><HiChartBar /></div>
                                    <div className="feature-text">
                                        <h4>Bütünleşik Pazarlama</h4>
                                        <p>Tüm kanalların birbiriyle uyumlu çalışmasını yönetiyoruz.</p>
                                    </div>
                                </div>
                                <div className="feature-item">
                                    <div className="feature-icon"><HiMagnifyingGlass /></div>
                                    <div className="feature-text">
                                        <h4>Veri Analizi</h4>
                                        <p>Kararlarımızı pazar gerçeklerine ve verilere dayandırıyoruz.</p>
                                    </div>
                                </div>
                                <div className="feature-item">
                                    <div className="feature-icon"><HiCommandLine /></div>
                                    <div className="feature-text">
                                        <h4>Teknoloji & Yazılım</h4>
                                        <p>İş süreçlerinizi dijital dönüşüm ve Maestro AI ile hızlandırıyoruz.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="about-visual">
                            <div className="image-frame">
                                <img src="/about-hero.png" alt="Khilonfast Vision" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How was khilonfast Born? Section */}
            <section className="about-birth">
                <div className="container">
                    <h2 className="section-title centered">khilonfast Nasıl Doğdu?</h2>
                    <div className="birth-grid">
                        <div className="birth-card">
                            <div className="birth-image">
                                <img src="/khilon-birth-1.png" alt="Gelenekselin Dışında" />
                            </div>
                            <h3>Gelenekselin Dışında</h3>
                            <p>Sektördeki klişeleri ve hantal yapıları yıkarak, modern dünyanın hızına uygun bir ajans modeliyle yola çıktık.</p>
                        </div>
                        <div className="birth-card">
                            <div className="birth-image">
                                <img src="/khilon-birth-2.png" alt="Farklı Bir Vizyon" />
                            </div>
                            <h3>Farklı Bir Vizyon</h3>
                            <p>Her işletmenin benzersiz bir potansiyeli olduğuna ve doğru stratejiyle her markanın zirveye ulaşabileceğine inanıyoruz.</p>
                        </div>
                        <div className="birth-card">
                            <div className="birth-image">
                                <img src="/khilon-birth-3.png" alt="Deneyimle Teknolojiyi Buluşturduk" />
                            </div>
                            <h3>Deneyimle Teknolojiyi Buluşturduk</h3>
                            <p>Pazarlamanın temel prensiplerini bugünün teknolojik imkanlarıyla harmanlayıp fark yaratan sonuçlar elde ettik.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Banner Quote */}
            <section className="about-banner-quote">
                <div className="container">
                    <h3>Dijital çağın hızına uyum sağlamayın, <span>onu yönetmeyi öğrenin!</span></h3>
                </div>
            </section>

            {/* Service Model Section */}
            <section className="about-model">
                <div className="container">
                    <div className="about-grid">
                        <div className="about-text-content">
                            <h2 className="section-title">Hizmet Modelimiz</h2>
                            <p className="section-description">
                                khilonfast olarak hizmet modelimizi işletmelerin sadece ihtiyaçlarına değil,
                                aynı zamanda büyüme potansiyellerine göre tasarladık.
                            </p>
                            <div className="model-sub-sections">
                                <div className="model-sub">
                                    <h4>Analiz Kanıksandığında</h4>
                                    <p>Her sürece derinlemesine bir analizle başlar, işletmenizin dijital röntgenini çekeriz. Mevcut durumunuzu anlayıp eksikleri gideririz.</p>
                                </div>
                                <div className="model-sub">
                                    <h4>Yenilikçi Yaklaşımlar</h4>
                                    <p>Standartların dışında, markanıza özel yaratıcı ve teknik çözümler geliştiririz. Sadece trendleri takip etmez, markanıza yön veririz.</p>
                                </div>
                            </div>
                        </div>
                        <div className="about-visual">
                            <img src="/service-model.png" alt="Service Model" className="rounded-img" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Why khilonfast Section */}
            <section className="why-khilon">
                <div className="container">
                    <div className="about-grid reverse">
                        <div className="about-text-content">
                            <h2 className="section-title">Neden khilonfast?</h2>
                            <p className="section-description">
                                İşletmenizi bir sonraki aşamaya taşımak için gerekli tüm dijital kasları sağlıyoruz.
                                Biz sadece bir hizmet sağlayıcı değil, büyüme yolculuğunuzdaki stratejik ortağınızız.
                            </p>
                            <div className="why-stats-grid">
                                <div className="why-stat-item">
                                    <HiChartBar className="stat-icon" />
                                    <h4>Veri Odaklı</h4>
                                    <p>Ölçemediğimiz hiçbir süreci yönetmiyoruz.</p>
                                </div>
                                <div className="why-stat-item">
                                    <HiRocketLaunch className="stat-icon" />
                                    <h4>Hızlı Etki</h4>
                                    <p>Zamanınızı boşa harcamadan sonuca odaklanıyoruz.</p>
                                </div>
                                <div className="why-stat-item">
                                    <HiSparkles className="stat-icon" />
                                    <h4>Global Vizyon</h4>
                                    <p>Dünya çapında geçerli pazarlama prensipleri uyguluyoruz.</p>
                                </div>
                                <div className="why-stat-item">
                                    <HiMagnifyingGlass className="stat-icon" />
                                    <h4>Derin Analiz</h4>
                                    <p>Rakiplerinizi ve pazarınızı her an izliyoruz.</p>
                                </div>
                            </div>
                        </div>
                        <div className="about-visual">
                            <img src="/why-khilon.png" alt="Why Khilonfast" className="floating-img" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Banner */}
            <section className="quick-banner">
                <div className="container">
                    <h2>Hızlı ve Etkili Pazarlama İçin khilonfast Yanınızda</h2>
                </div>
            </section>

            {/* Who is it NOT for Section */}
            <section className="not-for">
                <div className="container">
                    <div className="about-grid">
                        <div className="about-text-content">
                            <h2 className="section-title">khilonfast Kimler İçin <br />Uygun Değil?</h2>
                            <p className="section-description">
                                Vizyonumuzla örtüşmeyen bazı yaklaşımlar bizimle çalışmanız için uygun olmayabilir.
                            </p>
                            <div className="not-for-list">
                                <div className="not-item">
                                    <div className="not-icon"><HiXMark /></div>
                                    <div className="not-text">
                                        <h4>Geleneksel Çizgiden Tiksinenler İçin Değil</h4>
                                        <p>Eğer dijital dönüşüme ve yenilikçi yöntemlere kapalıysanız biz doğru adres olmayabiliriz.</p>
                                    </div>
                                </div>
                                <div className="not-item">
                                    <div className="not-icon"><HiXMark /></div>
                                    <div className="not-text">
                                        <h4>Sadece "Reklam Çıkalım" Diyenler</h4>
                                        <p>Biz sadece bütçe yönetmiyoruz; uçtan uca büyüme stratejisi ve marka otoritesi inşa ediyoruz.</p>
                                    </div>
                                </div>
                                <div className="not-item">
                                    <div className="not-icon"><HiXMark /></div>
                                    <div className="not-text">
                                        <h4>Kısa Vadeli Düşleyenler</h4>
                                        <p>Pazarlamanın bir yatırım ve süreç olduğunun farkında olan, vizyoner markalarla çalışıyoruz.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="about-visual">
                            <img src="/not-suitable.png" alt="Not for everyone" className="rounded-img shadow-lg" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Brand Statement */}
            <section className="brand-statement">
                <div className="container">
                    <div className="statement-box">
                        <img src="/fast-logo-big.svg" alt="Khilon" className="statement-logo" />
                        <h3>Alanında uzman kadromuzla markanızın büyüme serüveninde yanınızdayız.</h3>
                    </div>
                </div>
            </section>

            {/* Discover Section */}
            <section className="discover-banner">
                <div className="container">
                    <h2>Çözümlerimizi Keşfedin!</h2>
                    <p>İşinizi büyütmek için bugün bir adım atın.</p>
                    <div className="discover-actions">
                        <a href="/sektorel-hizmetler/b2b-360-pazarlama-yonetimi" className="btn btn-primary">Hemen Başlayın</a>
                        <a href="/iletisim" className="btn btn-outline">İletişime Geçin</a>
                    </div>
                </div>
            </section>
        </div>
    )
}
