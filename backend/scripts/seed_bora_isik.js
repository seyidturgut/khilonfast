import db from '../config/database.js';

const run = async () => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Danışman
        const [existing] = await connection.query('SELECT id FROM consultants WHERE slug = ?', ['bora-isik']);
        let consultantId;
        if (existing.length) {
            consultantId = existing[0].id;
            await connection.query(
                `UPDATE consultants SET name=?, title=?, bio=?, stars=?, review_count=?, sectors=?, is_active=1 WHERE id=?`,
                [
                    'Bora Işık',
                    'Growth Marketing & Fractional CMO Uzmanı',
                    'B2B ve B2C pazarlarında 15+ yıl deneyimle büyüme stratejisi, pazarlama organizasyonu ve satış-pazarlama entegrasyonu konularında danışmanlık hizmeti vermektedir. Fintech, ödeme sistemleri, SaaS ve kurumsal sektörlerde ekipleri ve ajansları yönlendirmiştir.',
                    5.0, 24,
                    JSON.stringify(['fintech', 'odeme-sistemleri', 'teknoloji-yazilim', 'b2b', 'filo-kiralama', 'enerji', 'uretim', 'ic-tasarim', 'endustriyel-gida']),
                    consultantId
                ]
            );
            console.log('🔄 Bora Işık güncellendi');
        } else {
            const [res] = await connection.query(
                `INSERT INTO consultants (slug, name, title, bio, stars, review_count, sectors, is_active)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
                [
                    'bora-isik',
                    'Bora Işık',
                    'Growth Marketing & Fractional CMO Uzmanı',
                    'B2B ve B2C pazarlarında 15+ yıl deneyimle büyüme stratejisi, pazarlama organizasyonu ve satış-pazarlama entegrasyonu konularında danışmanlık hizmeti vermektedir. Fintech, ödeme sistemleri, SaaS ve kurumsal sektörlerde ekipleri ve ajansları yönlendirmiştir.',
                    5.0, 24,
                    JSON.stringify(['fintech', 'odeme-sistemleri', 'teknoloji-yazilim', 'b2b', 'filo-kiralama', 'enerji', 'uretim', 'ic-tasarim', 'endustriyel-gida'])
                ]
            );
            consultantId = res.insertId;
            console.log('✅ Bora Işık eklendi, id:', consultantId);
        }

        // Mevcut hizmetleri sil (yeniden seed)
        await connection.query('DELETE FROM consultant_services WHERE consultant_id = ?', [consultantId]);

        const services = [
            // --- HIZLI DANIŞMANLIKLAR ---
            {
                category: 'hizli', sort_order: 1,
                title: 'Strategy Mentoring Session',
                title_en: 'Strategy Mentoring Session',
                description: '60 Dakikalık Strateji Mentorluk',
                description_en: '60-Minute Strategy Mentoring',
                scope_items: JSON.stringify(['growth marketing yönlendirmesi', 'müşteri kazanım stratejisi', 'pazarlama yatırımı değerlendirmesi']),
                scope_items_en: JSON.stringify(['growth marketing guidance', 'customer acquisition strategy', 'marketing investment evaluation']),
                duration_text: '60 dk', sessions_text: null,
                price: 20000, currency: 'TRY', plus_vat: true,
                cta_text: 'Seans Planla', cta_text_en: 'Schedule Session', badge_text: null
            },
            {
                category: 'hizli', sort_order: 2,
                title: 'Growth Marketing Check-up',
                title_en: 'Growth Marketing Check-up',
                description: 'Dijital pazarlama yatırımlarının hızlı analizi.',
                description_en: 'Rapid analysis of your digital marketing investments.',
                scope_items: JSON.stringify(['reklam performansı analizi', 'CAC ve ROAS değerlendirmesi', 'hızlı aksiyon önerileri']),
                scope_items_en: JSON.stringify(['ad performance analysis', 'CAC and ROAS evaluation', 'quick action recommendations']),
                duration_text: '60 dk', sessions_text: 'x3 seans',
                price: 150000, currency: 'TRY', plus_vat: true,
                cta_text: 'Check-up Başlat', cta_text_en: 'Start Check-up', badge_text: null
            },
            // --- STRATEJİ ÇALIŞMALARI ---
            {
                category: 'strateji', sort_order: 3,
                title: 'Executive Strategy Day',
                title_en: 'Executive Strategy Day',
                description: 'Üst yönetim ile yapılan stratejik çalışma.',
                description_en: 'Strategic workshop with senior leadership.',
                scope_items: JSON.stringify(['büyüme stratejisi analizi', 'pazarlama organizasyonu', 'satış–pazarlama entegrasyonu']),
                scope_items_en: JSON.stringify(['growth strategy analysis', 'marketing organization', 'sales–marketing integration']),
                duration_text: '1 gün', sessions_text: null,
                price: 150000, currency: 'TRY', plus_vat: true,
                cta_text: 'Strateji Günü Planla', cta_text_en: 'Plan Strategy Day', badge_text: null
            },
            // --- ÜST DÜZEY — Ana paket (gösterge, satın alınamaz doğrudan) ---
            {
                category: 'ust_duzey', sort_order: 4, parent_service_id: null,
                title: 'Fractional CMO Programı',
                title_en: 'Fractional CMO Program',
                description: 'Şirketiniz için yarı zamanlı Chief Marketing Officer desteği.',
                description_en: 'Part-time Chief Marketing Officer support for your company.',
                scope_items: JSON.stringify(['büyüme stratejisi oluşturma', 'pazarlama roadmap yönetimi', 'ekip ve ajans yönlendirmesi', 'yönetim ekibi ile stratejik toplantılar']),
                scope_items_en: JSON.stringify(['growth strategy development', 'marketing roadmap management', 'team and agency guidance', 'strategic meetings with leadership team']),
                duration_text: null, sessions_text: 'Minimum program: 3 ay',
                price: 0, currency: 'USD', plus_vat: false,
                cta_text: null, cta_text_en: null, badge_text: null
            }
        ];

        const serviceIds = {};
        for (const s of services) {
            const [r] = await connection.query(
                `INSERT INTO consultant_services
                 (consultant_id, category, parent_service_id, title, title_en, description, description_en,
                  scope_items, scope_items_en, duration_text, sessions_text, price, currency, plus_vat,
                  cta_text, cta_text_en, badge_text, sort_order)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    consultantId, s.category, s.parent_service_id ?? null,
                    s.title, s.title_en, s.description, s.description_en,
                    s.scope_items, s.scope_items_en,
                    s.duration_text, s.sessions_text,
                    s.price, s.currency, s.plus_vat ? 1 : 0,
                    s.cta_text, s.cta_text_en, s.badge_text, s.sort_order
                ]
            );
            serviceIds[s.title] = r.insertId;
            console.log('✅ Hizmet:', s.title, '→ id:', r.insertId);
        }

        // Fractional CMO alt paketleri
        const fcmoId = serviceIds['Fractional CMO Programı'];
        const subPackages = [
            {
                title: 'Advisory', title_en: 'Advisory',
                description: 'Ayda 2 strateji günü', description_en: '2 strategy days per month',
                duration_text: 'Ayda 2 strateji günü', sessions_text: 'Minimum program: 3 ay',
                price: 5000, currency: 'USD', plus_vat: false,
                cta_text: 'Programı Başlat', cta_text_en: 'Start Program', badge_text: null, sort_order: 5
            },
            {
                title: 'Growth', title_en: 'Growth',
                description: 'Ayda 4 strateji günü', description_en: '4 strategy days per month',
                duration_text: 'Ayda 4 strateji günü', sessions_text: 'Minimum program: 3 ay',
                price: 10000, currency: 'USD', plus_vat: false,
                cta_text: 'Programı Başlat', cta_text_en: 'Start Program', badge_text: '⭐ Most Preferred', sort_order: 6
            }
        ];

        for (const sp of subPackages) {
            const [r] = await connection.query(
                `INSERT INTO consultant_services
                 (consultant_id, category, parent_service_id, title, title_en, description, description_en,
                  scope_items, scope_items_en, duration_text, sessions_text, price, currency, plus_vat,
                  cta_text, cta_text_en, badge_text, sort_order)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    consultantId, 'ust_duzey', fcmoId,
                    sp.title, sp.title_en, sp.description, sp.description_en,
                    null, null,
                    sp.duration_text, sp.sessions_text,
                    sp.price, sp.currency, sp.plus_vat ? 1 : 0,
                    sp.cta_text, sp.cta_text_en, sp.badge_text, sp.sort_order
                ]
            );
            console.log('✅ Alt paket:', sp.title, '→ id:', r.insertId);
        }

        await connection.commit();
        console.log('\n🎉 Bora Işık seed tamamlandı!');
    } catch (err) {
        await connection.rollback();
        console.error('❌ Error:', err);
        process.exitCode = 1;
    } finally {
        connection.release();
        await db.end();
    }
};

run();
