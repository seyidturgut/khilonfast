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
    tx?: (key: string) => string;
}

export default function FAQ({ items, subtitle, tx }: FAQProps) {
    const { t } = useTranslation();
    const text = (key: string) => tx?.(key) ?? t(key);
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    const defaultFaqs = [
        {
            question: text('faq.item1.question'),
            answer: text('faq.item1.answer')
        },
        {
            question: text('faq.item2.question'),
            answer: text('faq.item2.answer')
        },
        {
            question: text('faq.item3.question'),
            answer: text('faq.item3.answer')
        },
        {
            question: text('faq.item4.question'),
            answer: text('faq.item4.answer')
        },
        {
            question: text('faq.item5.question'),
            answer: text('faq.item5.answer')
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
                    <h2 className="faq-logo">{text('faq.title')}</h2>
                    <p className="faq-subtitle">
                        {subtitle || text('faq.subtitle')}
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
