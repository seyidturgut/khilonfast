import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    HiAcademicCap,
    HiBolt,
    HiChartBar,
    HiChatBubbleLeftRight,
    HiComputerDesktop,
    HiFunnel,
    HiGlobeAlt,
    HiPencilSquare,
    HiPresentationChartLine,
    HiPuzzlePiece,
    HiRocketLaunch,
    HiUserGroup
} from 'react-icons/hi2';
import ServicePageTemplate from './templates/ServicePageTemplate';
import { trainingPrograms } from '../data/trainingPrograms';
import trCommon from '../locales/tr/common.json';
import enCommon from '../locales/en/common.json';

export default function TrainingProgramPage() {
    const location = useLocation();
    const { t, i18n } = useTranslation('common');
    const currentLang = i18n.language.split('-')[0];
    const isEn = currentLang === 'en';
    const langPrefix = isEn ? '/en' : '';

    const trSlugs = trCommon.slugs as Record<string, string>;
    const enSlugs = enCommon.slugs as Record<string, string>;

    const trainingSlugKeys = [
        'trainingGrowth',
        'trainingPayment',
        'trainingB2B',
        'trainingFintech',
        'trainingTech',
        'trainingManufacturing',
        'trainingEnergy',
        'trainingDesign',
        'trainingFleet',
        'trainingFood'
    ] as const;

    const trainingMenuKeyBySlugKey: Record<(typeof trainingSlugKeys)[number], string> = {
        trainingGrowth: 'growth',
        trainingPayment: 'payment',
        trainingB2B: 'b2b',
        trainingFintech: 'fintech',
        trainingTech: 'tech',
        trainingManufacturing: 'manufacturing',
        trainingEnergy: 'energy',
        trainingDesign: 'design',
        trainingFleet: 'fleet',
        trainingFood: 'food'
    };

    const normalizedPath = location.pathname
        .replace(/^\/en/, '')
        .replace(/^\/+/, '')
        .replace(/\/+$/, '');

    const matchedTrainingKey = trainingSlugKeys.find(
        (key) => trSlugs[key] === normalizedPath || enSlugs[key] === normalizedPath
    );

    const resolvedTrainingPath = matchedTrainingKey
        ? `/${trSlugs[matchedTrainingKey]}`
        : `/${normalizedPath}`;

    const training = useMemo(
        () => trainingPrograms.find((item) => item.path === resolvedTrainingPath) ?? trainingPrograms[0],
        [resolvedTrainingPath]
    );

    const resolvedSlugKey =
        matchedTrainingKey ??
        trainingSlugKeys.find((key) => `/${trSlugs[key]}` === training.path) ??
        'trainingGrowth';

    const trainingMenuKey = trainingMenuKeyBySlugKey[resolvedSlugKey];
    const trainingTitle = t(`header.menuItems.trainings.${trainingMenuKey}.title`);
    const trainingSummary = t(`header.menuItems.trainings.${trainingMenuKey}.desc`);

    const isPaymentSystemsTraining =
        training.path === '/egitimler/odeme-sistemlerinde-buyume-odakli-pazarlama-egitimi';
    const isFintechTraining = training.path === '/fintech-sektorunde-buyume-odakli-pazarlama-egitimi';
    const isSoftwareTraining = training.path === '/teknoloji-yazilim-sektorunde-buyume-odakli-pazarlama-egitimi';
    const isEnergyTraining = training.path === '/enerji-sektorunde-buyume-odakli-pazarlama-egitimi';
    const isInteriorDesignTraining =
        training.path === '/ofis-kurumsal-ic-tasarim-sektorunde-buyume-odakli-pazarlama-egitimi';
    const isFleetRentalTraining = training.path === '/filo-kiralama-sektorunde-buyume-odakli-pazarlama-egitimi';
    const isIndustrialFoodTraining = training.path === '/endustriyel-gida-sektorunde-buyume-odakli-pazarlama-egitimi';

    const defaultFeatures = isEn
        ? [
            {
                title: 'Audience Architecture and Segmentation',
                description: 'Define decision-maker and influencer personas precisely to build channel-fit messaging.',
                icon: <HiUserGroup />
            },
            {
                title: 'Value Proposition and Message Design',
                description: 'Craft differentiated value narratives that turn attention into commercial intent.',
                icon: <HiRocketLaunch />
            },
            {
                title: 'Sales Funnel Blueprint',
                description: 'Design stage-specific actions for awareness, consideration, and conversion.',
                icon: <HiFunnel />
            },
            {
                title: 'Measurement and Optimization System',
                description: 'Use KPI-driven iteration loops to sustain predictable, compounding growth.',
                icon: <HiChartBar />
            }
        ]
        : [
            {
                title: 'Hedef Kitle ve Segmentasyon',
                description: 'Karar verici ve etkileyici rolleri doğru analiz ederek kanal planı oluşturma.',
                icon: <HiUserGroup />
            },
            {
                title: 'Değer Önerisi ve Mesaj Kurgusu',
                description: 'Fark yaratan teklif metni ve iletişim çerçevesi geliştirme.',
                icon: <HiRocketLaunch />
            },
            {
                title: 'Satış Hunisi Tasarımı',
                description: 'Awareness, consideration ve conversion aşamaları için aksiyon planı.',
                icon: <HiFunnel />
            },
            {
                title: 'Ölçümleme ve Optimizasyon',
                description: 'Performans metrikleriyle düzenli iyileştirme ve sürdürülebilir büyüme.',
                icon: <HiChartBar />
            }
        ];

    const advancedFeatures = isEn
        ? [
            {
                title: 'Growth Marketing Foundations: Blueprint to Revenue',
                description: 'Build a practical strategic framework that links marketing actions directly to sales outcomes.',
                icon: <HiRocketLaunch />
            },
            {
                title: 'Decision Unit Mapping and Stakeholder Prioritization',
                description: 'Identify buyer, influencer, and approver roles to sharpen targeting and pipeline quality.',
                icon: <HiUserGroup />
            },
            {
                title: 'Pain-Point Discovery Workshop',
                description: 'Convert audience friction points into insight-backed messaging priorities.',
                icon: <HiPencilSquare />
            },
            {
                title: 'Value Proposition Engineering',
                description: 'Design persuasive narratives with logical, emotional, and credibility triggers.',
                icon: <HiPresentationChartLine />
            },
            {
                title: 'Role-Based Messaging Systems',
                description: 'Create role-specific copy structures for faster comprehension and stronger conversion intent.',
                icon: <HiPuzzlePiece />
            },
            {
                title: 'Funnel Messaging by Stage and Channel',
                description: 'Align content, timing, and distribution with each funnel stage to reduce drop-off.',
                icon: <HiFunnel />
            },
            {
                title: 'Baseline Metrics and Growth Dashboarding',
                description: 'Define measurement baselines and build decision-ready reporting workflows.',
                icon: <HiChartBar />
            },
            {
                title: 'Three Core Marketing Objectives',
                description: 'Balance acquisition, expansion, and retention through a clear growth operating model.',
                icon: <HiBolt />
            },
            {
                title: 'Website-Led Demand Architecture',
                description: 'Assign conversion roles to each key page and optimize your digital journey structure.',
                icon: <HiGlobeAlt />
            },
            {
                title: 'Post-Lead Sequence Design',
                description: 'Run high-converting follow-up flows with timing psychology and multi-channel touchpoints.',
                icon: <HiComputerDesktop />
            },
            {
                title: 'From First Contact to Closed Deal',
                description: 'Improve sales conversations through objection handling, sequencing, and disciplined follow-up.',
                icon: <HiChatBubbleLeftRight />
            }
        ]
        : [
            {
                title: 'Büyüme Odaklı Pazarlamaya Giriş: Satışa Giden Yolun Haritası',
                description: 'Büyüme odaklı pazarlamanın temel çerçevesini kurun ve satışa giden yolu haritalayın.',
                icon: <HiRocketLaunch />
            },
            {
                title: isPaymentSystemsTraining
                    ? 'Ödeme Sistemlerinde Hedef Kitle: Karar Verici ve Onaylayıcıyı Doğru Okumak'
                    : 'Hedef Kitle: Karar Verici ve Onaylayıcıyı Doğru Okumak',
                description: isPaymentSystemsTraining
                    ? 'Ödeme sistemleri ekosisteminde karar verici ve onaylayıcı rolleri doğru ayrıştırın.'
                    : 'Karar verici ve onaylayıcı rolleri doğru ayrıştırarak hedef kitle analizini netleştirin.',
                icon: <HiUserGroup />
            },
            {
                title: 'Egzersiz: Hedef Kitle Sorunlarını Not Etmek',
                description: 'Hedef kitlenin sorunlarını sistematik biçimde not ederek içgörü üretin.',
                icon: <HiPencilSquare />
            },
            {
                title: 'Değer Önerisi: Ethos, Pathos, Logos ile Fark Yaratmak',
                description: 'Ethos, Pathos ve Logos yaklaşımıyla güçlü bir değer önerisi geliştirin.',
                icon: <HiPresentationChartLine />
            },
            {
                title: 'Değer Önerisini Sistematik Kurmak: Pain Point ve Rol Bazlı Mesaj',
                description: 'Pain point odaklı ve rol bazlı mesajlarla değer önerinizi sistematik hale getirin.',
                icon: <HiPuzzlePiece />
            },
            {
                title: 'Satış Hunisi: Mesajı Zaman, Mecra ve Aşamaya Göre Uyarlamak',
                description: 'Mesajınızı doğru zamanda, doğru mecrada ve doğru aşamada konumlandırın.',
                icon: <HiFunnel />
            },
            {
                title: 'Başlangıç Metrikleri: Büyümenin Sayısal Pusulası',
                description: 'Büyümeyi ölçmek için başlangıç metriklerini belirleyin ve takip modelini kurun.',
                icon: <HiChartBar />
            },
            {
                title: 'Pazarlamanın Üç Net Hedefi: Kazanmak, Derinleşmek, Korumak',
                description: 'Kazanım, derinleşme ve koruma ekseninde pazarlama hedeflerinizi netleştirin.',
                icon: <HiBolt />
            },
            {
                title: 'Web Sitesi ile Büyümek: Web Sitesindeki Sayfaların Görevleri',
                description: 'Web sitesi sayfalarının rollerini netleştirerek dönüşüm akışını iyileştirin.',
                icon: <HiGlobeAlt />
            },
            {
                title: 'Lead Sonrası Akış: Psikoloji, Zamanlama ve Çok Kanallı Temas',
                description: 'Lead sonrası süreçte psikoloji, zamanlama ve çok kanallı temas dengesini kurun.',
                icon: <HiComputerDesktop />
            },
            {
                title: 'İlk Temastan Satışa: Etkili İletişim, İtiraz Yönetimi ve Takip',
                description: 'İlk temastan satış kapanışına kadar iletişim, itiraz yönetimi ve takibi yönetin.',
                icon: <HiChatBubbleLeftRight />
            }
        ];

    const shouldUseAdvancedFeatures =
        isPaymentSystemsTraining ||
        isFintechTraining ||
        isSoftwareTraining ||
        isEnergyTraining ||
        isInteriorDesignTraining ||
        isFleetRentalTraining ||
        isIndustrialFoodTraining;

    const checkoutPath = `${langPrefix}/${t('slugs.checkout')}`.replace(/\/{2,}/g, '/');

    const config = {
        hero: {
            title: trainingTitle,
            subtitle: isEn ? 'Growth-Focused Marketing Training Program' : 'Büyüme Odaklı Pazarlama Eğitimi',
            description: trainingSummary,
            buttonText: isEn ? 'Join Program' : 'Programa Katıl',
            buttonLink: '#pricing',
            image: '/hero-image.png',
            badgeText: isEn ? '10+1 Module Training' : '10+1 Modül Eğitim',
            badgeIcon: <HiAcademicCap />
        },
        breadcrumbs: [
            { label: isEn ? 'Trainings' : 'Eğitimlerimiz', path: `/${t('slugs.trainings')}` },
            { label: trainingTitle }
        ],
        videoShowcase: {
            tag: isEn ? 'Program Overview' : 'Eğitim Tanıtımı',
            title: <>{isEn ? 'Applied Training Program Built for Revenue Outcomes' : 'Satışa Giden Yol için Uygulamalı Eğitim Programı'}</>,
            description: isEn
                ? 'This program builds a scalable growth system around audience strategy, value proposition, and performance measurement to accelerate your team\'s sales outcomes.'
                : 'Pazarlama stratejisini hedef kitle, değer önerisi ve ölçümleme odaklı kuran bu program; ekiplerinizi satışa daha hızlı taşıyan sistematik bir yöntem sunar.',
            videoUrl: isPaymentSystemsTraining
                ? 'https://vimeo.com/showcase/12025562/embed2'
                : 'https://player.vimeo.com/video/1045939223'
        },
        featuresSection: {
            tag: isEn ? 'Program Content' : 'Program İçeriği',
            title: isEn ? 'Modules Included in the Training' : 'Eğitimde Yer Alan Modüller',
            description: isEn
                ? 'A field-ready curriculum designed to move teams from strategy to execution.'
                : 'Temelden uygulamaya uzanan, sahada uygulanabilir eğitim akışı.',
            features: shouldUseAdvancedFeatures ? advancedFeatures : defaultFeatures
        },
        pricingSection: {
            tag: isEn ? 'Registration' : 'Kayıt',
            title: isEn ? 'Training Program' : 'Eğitim Programı',
            description: isEn
                ? 'Enroll to establish a growth-focused marketing operating model across your team.'
                : 'Eğitime katılarak ekibiniz için büyüme odaklı pazarlama sistemini kurun.',
            packages: [
                {
                    id: training.productKey,
                    name: trainingTitle,
                    price: '5.000 TL',
                    period: isEn ? 'one-time' : 'tek seferlik',
                    description: isEn
                        ? 'Includes video modules, practical frameworks, and an execution playbook.'
                        : 'Video modüller, pratik şablonlar ve uygulama rehberi içerir.',
                    isPopular: true,
                    icon: <HiAcademicCap />,
                    features: isEn
                        ? [
                            '10+1 structured training modules',
                            'Applied tasks and practical examples',
                            'Sector-specific growth methodology',
                            'Performance measurement templates',
                            'Team-friendly implementation structure'
                        ]
                        : [
                            '10+1 modül eğitim içeriği',
                            'Uygulamalı görev ve örnekler',
                            'Sektör odaklı büyüme yaklaşımı',
                            'Ölçümleme şablonları',
                            'Ekip kullanımına uygun içerik yapısı'
                        ],
                    buttonText: isEn ? 'Buy Now' : 'Satın Al',
                    buttonLink: checkoutPath
                }
            ]
        },
        heroPriceCard: {
            packageId: training.productKey,
            priceOnly: true
        },
        testimonial: {
            quote: isEn
                ? 'After the training, our marketing and sales teams aligned around one operating language; lead quality and close rates improved noticeably.'
                : 'Eğitim sonrası pazarlama ve satış ekiplerimizin dili aynılaştı; lead kalitesi ve kapanış oranları belirgin şekilde arttı.',
            author: isEn ? 'khilonfast Participant' : 'khilonfast Katılımcısı',
            role: isEn ? 'Program Graduate' : 'Program Mezunu'
        },
        faqs: [
            {
                question: isEn ? 'When is program access activated?' : 'Eğitime erişim ne zaman açılır?',
                answer: isEn
                    ? 'Your access is activated shortly after enrollment so you can begin immediately.'
                    : 'Kayıt sonrası erişiminiz kısa sürede aktif edilir ve eğitim modüllerine hemen başlayabilirsiniz.'
            },
            {
                question: isEn ? 'Which experience levels is this training suitable for?' : 'Eğitim içeriği hangi seviyeye uygundur?',
                answer: isEn
                    ? 'The program is designed for both leadership and operational teams, combining strategy with real implementation.'
                    : 'Program hem yönetici seviyesine hem de operasyon ekiplerine uygundur; strateji ve uygulama birlikte ele alınır.'
            },
            {
                question: isEn ? 'Is it suitable for corporate teams?' : 'Kurumsal ekipler için uygun mu?',
                answer: isEn
                    ? 'Yes. The structure is optimized for team-based adoption and cross-functional execution.'
                    : 'Evet. İçerik ekip içi kullanım için yapılandırılmıştır ve ortak çalışma akışı sağlar.'
            }
        ]
    };

    return <ServicePageTemplate {...config} serviceKey={training.productKey} disableApiHeroTextOverride />;
}
