import FAQ from '../FAQ';

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQBlockProps {
    data: {
        subtitle?: string;
        items?: FAQItem[];
    };
}

export default function FAQBlock({ data }: FAQBlockProps) {
    const {
        subtitle,
        items = [
            {
                question: 'khilonfast hangi hizmetleri sunar?',
                answer: 'khilonfast; denetim, strateji geliştirme, dijital pazarlama, marka yönetimi, CRM, satış ve kurumsal iletişim gibi alanlarda uçtan uca pazarlama hizmetleri sunar.'
            },
            {
                question: 'Hizmet fiyatlandırması nasıl belirlenir?',
                answer: 'khilonfast\'in hizmet ücretleri, hizmet türüne ve iş birliği modeline göre farklılık gösterir. Aylık sabit ücretli (retainer) ve proje/ürün bazlı fiyatlandırma seçeneklerimiz mevcuttur.'
            }
        ]
    } = data;

    // FAQ component already accepts items and subtitle as props
    return <FAQ items={items} subtitle={subtitle} />;
}
