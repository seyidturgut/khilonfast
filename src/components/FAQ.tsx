import { useState } from 'react'
import { HiChevronDown } from 'react-icons/hi2'
import { useTranslation } from 'react-i18next'
import './FAQ.css'

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQProps {
    items?: FAQItem[];
    subtitle?: string;
}

export default function FAQ({ items, subtitle }: FAQProps) {
    const { t } = useTranslation();
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    const defaultFaqs = [
        {
            question: t('faq.item1.question'),
            answer: t('faq.item1.answer')
        },
        {
            question: t('faq.item2.question'),
            answer: t('faq.item2.answer')
        },
        {
            question: t('faq.item3.question'),
            answer: t('faq.item3.answer')
        },
        {
            question: t('faq.item4.question'),
            answer: t('faq.item4.answer')
        },
        {
            question: t('faq.item5.question'),
            answer: t('faq.item5.answer')
        }
    ]

    const displayItems = items || defaultFaqs;

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index)
    }

    return (
        <section className="faq">
            <div className="container faq-container">
                <div className="faq-header">
                    <h2 className="faq-logo">{t('faq.title')}</h2>
                    <p className="faq-subtitle">
                        {subtitle || t('faq.subtitle')}
                    </p>
                </div>

                <div className="faq-list">
                    {displayItems.map((item, index) => (
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
