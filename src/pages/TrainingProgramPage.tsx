import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { HiAcademicCap, HiChartBar, HiFunnel, HiRocketLaunch, HiUserGroup } from 'react-icons/hi2';
import ServicePageTemplate from './templates/ServicePageTemplate';
import { trainingPrograms } from '../data/trainingPrograms';

export default function TrainingProgramPage() {
    const location = useLocation();

    const training = useMemo(
        () => trainingPrograms.find((item) => item.path === location.pathname) ?? trainingPrograms[0],
        [location.pathname]
    );

    const config = {
        hero: {
            title: training.title,
            subtitle: 'Büyüme Odaklı Pazarlama Eğitimi',
            description: training.summary,
            buttonText: 'Programa Katıl',
            buttonLink: '#pricing',
            image: '/hero-image.png',
            badgeText: '10+1 Modül Eğitim',
            badgeIcon: <HiAcademicCap />
        },
        breadcrumbs: [
            { label: 'Eğitimler', path: '/egitimler' },
            { label: training.title }
        ],
        videoShowcase: {
            tag: 'Eğitim Tanıtımı',
            title: <>Satışa Giden Yol için Uygulamalı Eğitim Programı</>,
            description: 'Pazarlama stratejisini hedef kitle, değer önerisi ve ölçümleme odaklı kuran bu program; ekiplerinizi satışa daha hızlı taşıyan sistematik bir yöntem sunar.',
            videoUrl: 'https://vimeo.com/1045939223'
        },
        featuresSection: {
            tag: 'Program İçeriği',
            title: 'Eğitimde Yer Alan Modüller',
            description: 'Temelden uygulamaya uzanan, sahada uygulanabilir eğitim akışı.',
            features: [
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
            ]
        },
        pricingSection: {
            tag: 'Kayıt',
            title: 'Eğitim Programı',
            description: 'Eğitime katılarak ekibiniz için büyüme odaklı pazarlama sistemini kurun.',
            packages: [
                {
                    id: 'training-program',
                    name: training.title,
                    price: '5.000 TL',
                    period: 'tek seferlik',
                    description: 'Video modüller, pratik şablonlar ve uygulama rehberi içerir.',
                    isPopular: true,
                    icon: <HiAcademicCap />,
                    features: [
                        '10+1 modül eğitim içeriği',
                        'Uygulamalı görev ve örnekler',
                        'Sektör odaklı büyüme yaklaşımı',
                        'Ölçümleme şablonları',
                        'Ekip kullanımına uygun içerik yapısı'
                    ],
                    buttonText: 'Kayıt Ol',
                    buttonLink: '/#contact'
                }
            ]
        },
        testimonial: {
            quote: 'Eğitim sonrası pazarlama ve satış ekiplerimizin dili aynılaştı; lead kalitesi ve kapanış oranları belirgin şekilde arttı.',
            author: 'Khilonfast Katılımcısı',
            role: 'Program Mezunu'
        },
        faqs: [
            {
                question: 'Eğitime erişim ne zaman açılır?',
                answer: 'Kayıt sonrası erişiminiz kısa sürede aktif edilir ve eğitim modüllerine hemen başlayabilirsiniz.'
            },
            {
                question: 'Eğitim içeriği hangi seviyeye uygundur?',
                answer: 'Program hem yönetici seviyesine hem de operasyon ekiplerine uygundur; strateji ve uygulama birlikte ele alınır.'
            },
            {
                question: 'Kurumsal ekipler için uygun mu?',
                answer: 'Evet. İçerik ekip içi kullanım için yapılandırılmıştır ve ortak çalışma akışı sağlar.'
            }
        ]
    };

    return <ServicePageTemplate {...config} />;
}
