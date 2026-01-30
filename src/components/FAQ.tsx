import { useState } from 'react'
import { HiChevronDown } from 'react-icons/hi2'
import './FAQ.css'

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQProps {
    items?: FAQItem[];
    subtitle?: string;
}

const defaultFaqs = [
    {
        question: 'khilonfast hangi hizmetleri sunar?',
        answer: 'khilonfast; denetim, strateji geliştirme, dijital pazarlama, marka yönetimi, CRM, satış ve kurumsal iletişim gibi alanlarda uçtan uca pazarlama hizmetleri sunar. Her hizmet, markaların iş hedeflerine değer katacak şekilde tasarlanır ve ihtiyaçlara göre özelleştirilebilir.'
    },
    {
        question: 'Hizmet fiyatlandırması nasıl belirlenir?',
        answer: 'khilonfast\'in hizmet ücretleri, hizmet türüne ve iş birliği modeline göre farklılık gösterir. Aylık sabit ücretli (retainer) ve proje/ürün bazlı fiyatlandırma seçeneklerimiz mevcuttur. Detaylı bilgi için bizimle iletişime geçebilirsiniz.'
    },
    {
        question: 'khilonfast ile çalışma modelim nasıl belirlenir?',
        answer: 'khilonfast, markaların ihtiyaçlarına göre şekillenen esnek iş birliği modelleri sunar. İster aylık sabit ücretli bir çalışma modeli, ister size özel çözümler ya da belirli ürün bazlı hizmetler tercih edin — pazarlama hedeflerinize en uygun yapıyı birlikte oluşturabiliriz.'
    },
    {
        question: 'Başarı hikayeleriniz var mı?',
        answer: 'Evet, hizmetlerimizin markalar üzerindeki etkisini gösteren birçok başarı hikayemiz ve müşteri yorumumuz bulunuyor. Detaylı bilgi için bize ulaşabilirsiniz.'
    },
    {
        question: 'Size nasıl ulaşabilirim?',
        answer: 'khilonfast ile iletişime geçmek için web sitemizdeki iletişim formunu doldurabilir veya bize e-posta ve telefon aracılığıyla doğrudan ulaşabilirsiniz. Sizden haber almayı sabırsızlıkla bekliyoruz!'
    }
]

export default function FAQ({ items = defaultFaqs, subtitle }: FAQProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index)
    }

    return (
        <section className="faq">
            <div className="container faq-container">
                <div className="faq-header">
                    <h2 className="faq-logo">SSS</h2>
                    <p className="faq-subtitle">
                        {subtitle || (
                            <>
                                khilonfast hizmetleri hakkında sıkça sorulan soruların yanıtlarını<br />
                                burada bulabilirsiniz!
                            </>
                        )}
                    </p>
                </div>

                <div className="faq-list">
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className={`faq-item ${openIndex === index ? 'active' : ''}`}
                        >
                            <button
                                className="faq-question"
                                onClick={() => toggleFAQ(index)}
                            >
                                <span>{item.question}</span>
                                <HiChevronDown className="faq-icon" />
                            </button>

                            <div className="faq-answer">
                                <p>{item.answer}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
