import db from '../config/database.js';

const slug = 'egitimler/odeme-sistemlerinde-buyume-odakli-pazarlama-egitimi';

const content = {
    tr: {
        hero: {
            title: 'Ödeme Sistemlerinde Büyüme Odaklı Pazarlama Eğitimi',
            subtitle: 'Büyüme Odaklı Pazarlama Eğitimi',
            description: 'Satış hunisi, değer önerisi ve ölçümleme odaklı uygulamalı içerik.',
            buttonText: 'Programa Katıl',
            buttonLink: '#pricing',
            badgeText: '10+1 Modül Eğitim',
            image: '/hero-image.png'
        },
        videoShowcase: {
            tag: 'Eğitim Tanıtımı',
            title: 'Satışa Giden Yol için Uygulamalı Eğitim Programı',
            description: 'Pazarlama stratejisini hedef kitle, değer önerisi ve ölçümleme odaklı kuran bu program; ekiplerinizi satışa daha hızlı taşıyan sistematik bir yöntem sunar.',
            videoUrl: 'https://vimeo.com/1133021053?fl=pl&fe=cm'
        },
        featuresSection: {
            tag: 'Program İçeriği',
            title: 'Eğitimde Yer Alan Modüller',
            description: 'Temelden uygulamaya uzanan, sahada uygulanabilir eğitim akışı.',
            features: [
                {
                    title: 'Toptan Değer Önerisi: Ne Satıyoruz?',
                    description: 'Yaratıcı netlik için değer önerisini kitleye göre yapılandırın.'
                },
                {
                    title: 'B2B Satış Hunisi Tasarımı',
                    description: 'B2B satış döngüsüne uygun funnel akışını tasarlayın.'
                },
                {
                    title: 'Talep Üretimi: Doğru Mesaj ve Kanal',
                    description: 'İlgiyi fırsata çevirmek için mesaj ve kanal eşleşmesi kurun.'
                },
                {
                    title: 'İçerik ve Kanal Mimarisi',
                    description: 'Kanal ve içerik yapısını satışa hizmet edecek şekilde kurgulayın.'
                },
                {
                    title: 'Pazarlamanın Üç Net Hedefi: Kazanmak, Derinleşmek, Korumak',
                    description: 'Kazanım, derinleşme ve koruma ekseninde pazarlama hedeflerinizi netleştirin.'
                },
                {
                    title: 'Web Sitesi ile Büyümek: Web Sitesindeki Sayfaların Görevleri',
                    description: 'Web sitesi sayfalarının rollerini netleştirerek dönüşüm akışını iyileştirin.'
                },
                {
                    title: 'Lead Sonrası Akış: Psikoloji, Zamanlama ve Çok Kanallı Temas',
                    description: 'Lead sonrası süreçte psikoloji, zamanlama ve çok kanallı temas dengesini kurun.'
                },
                {
                    title: 'İlk Temastan Satışa: Etkili İletişim, İtiraz Yönetimi ve Takip',
                    description: 'İlk temastan satış kapanışına kadar iletişim, itiraz yönetimi ve takibi yönetin.'
                }
            ]
        },
        pricingSection: {
            tag: 'Kayıt',
            title: 'Eğitim Programı',
            description: 'Eğitime katılarak ekibiniz için büyüme odaklı pazarlama sistemini kurun.'
        },
        testimonial: {
            quote: 'Eğitim sonrası pazarlama ve satış ekiplerimizin dili aynılaştı; lead kalitesi ve kapanış oranları belirgin şekilde arttı.',
            author: 'khilonfast Katılımcısı',
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
    },
    en: {
        hero: {
            title: 'Growth-Oriented Marketing Training in Payment Systems',
            subtitle: 'Growth-Focused Marketing Training Program',
            description: 'Applied content focused on sales funnel, value proposition, and measurement.',
            buttonText: 'Join Program',
            buttonLink: '#pricing',
            badgeText: '10+1 Module Training',
            image: '/hero-image.png'
        },
        videoShowcase: {
            tag: 'Program Overview',
            title: 'Applied Training Program Built for Revenue Outcomes',
            description: 'This program builds a scalable growth system around audience strategy, value proposition, and performance measurement to accelerate your team\'s sales outcomes.',
            videoUrl: 'https://vimeo.com/1133021053?fl=pl&fe=cm'
        },
        featuresSection: {
            tag: 'Program Content',
            title: 'Modules Included in the Training',
            description: 'A field-ready curriculum designed to move teams from strategy to execution.',
            features: [
                {
                    title: 'Define the Value Proposition',
                    description: 'Structure your value proposition around the right buyer needs.'
                },
                {
                    title: 'B2B Funnel Design',
                    description: 'Build a funnel aligned with long-cycle B2B buying behavior.'
                },
                {
                    title: 'Demand Generation',
                    description: 'Align message and channel to turn attention into opportunity.'
                },
                {
                    title: 'Content & Channel Architecture',
                    description: 'Design a content and channel system that supports sales.'
                },
                {
                    title: 'Three Marketing Objectives: Win, Deepen, Retain',
                    description: 'Clarify marketing goals across acquisition, depth, and retention.'
                },
                {
                    title: 'Website Growth Mechanics',
                    description: 'Clarify the role of each page to improve conversion flow.'
                },
                {
                    title: 'Post-Lead Workflow',
                    description: 'Balance psychology, timing, and multi-channel touchpoints.'
                },
                {
                    title: 'From First Touch to Close',
                    description: 'Manage communication, objections, and follow-up to close.'
                }
            ]
        },
        pricingSection: {
            tag: 'Registration',
            title: 'Training Program',
            description: 'Enroll to establish a growth-focused marketing operating model across your team.'
        },
        testimonial: {
            quote: 'After the training, our marketing and sales teams aligned around one operating language; lead quality and close rates improved noticeably.',
            author: 'khilonfast Participant',
            role: 'Program Graduate'
        },
        faqs: [
            {
                question: 'When is program access activated?',
                answer: 'Your access is activated shortly after enrollment so you can begin immediately.'
            },
            {
                question: 'Which experience levels is this training suitable for?',
                answer: 'The program is designed for both leadership and operational teams, combining strategy with real implementation.'
            },
            {
                question: 'Is it suitable for corporate teams?',
                answer: 'Yes. The structure is optimized for team-based adoption and cross-functional execution.'
            }
        ]
    }
};

const run = async () => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [pages] = await connection.query('SELECT id FROM cms_pages WHERE slug = ? LIMIT 1', [slug]);
        let pageId;
        if (pages.length) {
            pageId = pages[0].id;
            await connection.query(
                'UPDATE cms_pages SET title = ?, is_active = 1 WHERE id = ?',
                ['Ödeme Sistemlerinde Büyüme Odaklı Pazarlama Eğitimi', pageId]
            );
        } else {
            const [result] = await connection.query(
                'INSERT INTO cms_pages (title, slug, meta_title, meta_description, is_active) VALUES (?, ?, ?, ?, 1)',
                ['Ödeme Sistemlerinde Büyüme Odaklı Pazarlama Eğitimi', slug, '', '']
            );
            pageId = result.insertId;
        }

        await connection.query('DELETE FROM cms_page_contents WHERE page_id = ?', [pageId]);
        await connection.query(
            'INSERT INTO cms_page_contents (page_id, content_json, is_published) VALUES (?, ?, 1)',
            [pageId, JSON.stringify(content)]
        );

        await connection.commit();
        console.log('✅ Eğitim sayfası CMS içeriği yazıldı:', slug);
    } catch (err) {
        await connection.rollback();
        console.error('❌ Seed error:', err);
        process.exitCode = 1;
    } finally {
        connection.release();
        await db.end();
    }
};

run();
