import db from '../config/database.js';

const consultingProducts = [
    {
        product_key: 'consulting-odeme-sistemlerinde-buyume',
        name: 'Ödeme Sistemlerinde Büyüme Odaklı Pazarlama Danışmanlığı',
        description: 'Ödeme sistemleri şirketinizde yüz yüze, uygulamalı büyüme odaklı pazarlama danışmanlığı.',
        price: 5000.00,
        currency: 'USD',
        category: 'danismanlik',
        type: 'service'
    },
    {
        product_key: 'consulting-b2b-sektorunde-buyume',
        name: 'B2B Sektöründe Büyüme Odaklı Pazarlama Danışmanlığı',
        description: 'B2B firmanızda yüz yüze pazarlama ve satış entegrasyonu danışmanlığı.',
        price: 5000.00,
        currency: 'USD',
        category: 'danismanlik',
        type: 'service'
    },
    {
        product_key: 'consulting-fintech-sektorunde-buyume',
        name: 'Fintech Sektöründe Büyüme Odaklı Pazarlama Danışmanlığı',
        description: 'Fintech firmanızda büyüme stratejileri ve kanal optimizasyonu danışmanlığı.',
        price: 5000.00,
        currency: 'USD',
        category: 'danismanlik',
        type: 'service'
    },
    {
        product_key: 'consulting-teknoloji-yazilim-buyume',
        name: 'Teknoloji & Yazılım Sektöründe Büyüme Odaklı Pazarlama Danışmanlığı',
        description: 'SaaS ve teknoloji şirketinizde performans odaklı danışmanlık.',
        price: 5000.00,
        currency: 'USD',
        category: 'danismanlik',
        type: 'service'
    },
    {
        product_key: 'consulting-uretim-sektorunde-buyume',
        name: 'Üretim Sektöründe Büyüme Odaklı Pazarlama Danışmanlığı',
        description: 'Üretim firmanızda sürdürülebilir talep ve dönüşüm yönetimi danışmanlığı.',
        price: 5000.00,
        currency: 'USD',
        category: 'danismanlik',
        type: 'service'
    },
    {
        product_key: 'consulting-enerji-sektorunde-buyume',
        name: 'Enerji Sektöründe Büyüme Odaklı Pazarlama Danışmanlığı',
        description: 'Enerji şirketinizde karar verici odaklı pazarlama planlama danışmanlığı.',
        price: 5000.00,
        currency: 'USD',
        category: 'danismanlik',
        type: 'service'
    },
    {
        product_key: 'consulting-ofis-kurumsal-ic-tasarim-buyume',
        name: 'Ofis & Kurumsal İç Tasarım Sektöründe Büyüme Odaklı Pazarlama Danışmanlığı',
        description: 'Kurumsal iç tasarım firmanızda tekliften satışa pazarlama danışmanlığı.',
        price: 5000.00,
        currency: 'USD',
        category: 'danismanlik',
        type: 'service'
    },
    {
        product_key: 'consulting-filo-kiralama-sektorunde-buyume',
        name: 'Filo Kiralama Sektöründe Büyüme Odaklı Pazarlama Danışmanlığı',
        description: 'Filo kiralama firmanızda lead kalitesi ve dönüşüm yönetimi danışmanlığı.',
        price: 5000.00,
        currency: 'USD',
        category: 'danismanlik',
        type: 'service'
    },
    {
        product_key: 'consulting-endustriyel-gida-sektorunde-buyume',
        name: 'Endüstriyel Gıda Sektöründe Büyüme Odaklı Pazarlama Danışmanlığı',
        description: 'Endüstriyel gıda sektörüne özel büyüme odaklı pazarlama danışmanlığı.',
        price: 5000.00,
        currency: 'USD',
        category: 'danismanlik',
        type: 'service'
    }
];

const run = async () => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        let inserted = 0;
        let skipped = 0;

        for (const product of consultingProducts) {
            const [existing] = await connection.query(
                'SELECT id FROM products WHERE product_key = ? LIMIT 1',
                [product.product_key]
            );

            if (existing.length > 0) {
                await connection.query(
                    `UPDATE products SET name=?, description=?, price=?, currency=?, category=?, type=?, is_active=1
                     WHERE product_key=?`,
                    [product.name, product.description, product.price, product.currency, product.category, product.type, product.product_key]
                );
                console.log(`🔄 Güncellendi: ${product.product_key}`);
                skipped++;
            } else {
                await connection.query(
                    `INSERT INTO products (product_key, name, description, price, currency, category, type, is_active)
                     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
                    [product.product_key, product.name, product.description, product.price, product.currency, product.category, product.type]
                );
                console.log(`✅ Eklendi: ${product.product_key}`);
                inserted++;
            }
        }

        await connection.commit();
        console.log(`\n🎉 Tamamlandı: ${inserted} yeni eklendi, ${skipped} güncellendi.`);
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
