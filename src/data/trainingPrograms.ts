import type { AppLocale } from '../utils/locale'
import type { LocalizedProgram, LocalizedValue } from '../utils/localizedContent'
import { getLocalizedPrograms, pickLocalizedValue } from '../utils/localizedContent'
import trCommon from '../locales/tr/common.json'
import enCommon from '../locales/en/common.json'

export interface TrainingProgram {
    path: string
    productKey: string
    title: string
    summary: string
    aiAnswer: { question: string; answer: string }
}

interface TrainingProgramCatalogEntry extends LocalizedProgram {
    aiAnswer: {
        question: LocalizedValue
        answer: LocalizedValue
    }
}

const trSlugs = trCommon.slugs as Record<string, string>
const enSlugs = enCommon.slugs as Record<string, string>

function buildLocalizedTrainingPath(locale: AppLocale, slugKey: string): string {
    const slugMap = locale === 'en' ? enSlugs : trSlugs
    const prefix = locale === 'en' ? '/en' : ''
    return `${prefix}/${slugMap[slugKey]}`.replace(/\/{2,}/g, '/')
}

export const trainingProgramCatalog: TrainingProgramCatalogEntry[] = [
    {
        path: {
            tr: buildLocalizedTrainingPath('tr', 'trainingGrowth'),
            en: buildLocalizedTrainingPath('en', 'trainingGrowth')
        },
        productKey: 'training-buyume-odakli-pazarlama',
        title: {
            tr: 'Bora Işık ile Büyüme Odaklı Pazarlama Eğitimi',
            en: 'Growth-Focused Marketing Training with Bora Işık'
        },
        summary: {
            tr: 'khilonfast temel büyüme odaklı pazarlama eğitim programı.',
            en: 'The core khilonfast training program for growth-oriented marketing.'
        },
        aiAnswer: {
            question: {
                tr: 'Bora Işık ile Büyüme Odaklı Pazarlama Eğitimi nedir?',
                en: 'What is the Growth-Focused Marketing Training with Bora Işık?'
            },
            answer: {
                tr: 'CMO Bora Işık\'ın anlattığı 10+1 modüllük temel eğitim programıdır; hedef kitle, değer önerisi, satış hunisi ve ölçümleme konularını sistematik bir çerçevede ele alır. Sektör bağımsız, tüm pazarlama ve satış ekipleri için uygundur.',
                en: 'A core 10+1 module training led by CMO Bora Işık covering audience strategy, value proposition, sales funnels, and measurement in one systematic framework. It is sector-agnostic and fits any marketing or sales team.'
            }
        }
    },
    {
        path: {
            tr: buildLocalizedTrainingPath('tr', 'trainingPayment'),
            en: buildLocalizedTrainingPath('en', 'trainingPayment')
        },
        productKey: 'training-odeme-sistemlerinde-buyume',
        title: {
            tr: 'Ödeme Sistemlerinde Büyüme Odaklı Pazarlama Eğitimi',
            en: 'Growth-Oriented Marketing Training in Payment Systems'
        },
        summary: {
            tr: 'Satış hunisi, değer önerisi ve ölçümleme odaklı uygulamalı içerik.',
            en: 'Applied content focused on sales funnels, value proposition, and measurement.'
        },
        aiAnswer: {
            question: {
                tr: 'Ödeme Sistemlerinde Büyüme Odaklı Pazarlama Eğitimi nedir?',
                en: 'What is the Growth-Oriented Marketing Training in Payment Systems?'
            },
            answer: {
                tr: 'Ödeme sistemleri şirketlerindeki CFO, CTO ve e-ticaret yöneticisi gibi farklı karar verici rollerini doğru okumayı öğreten 10+1 modüllük eğitimdir. Uyum gereksinimlerini gözeten mesajlaşma ve dönüşüm stratejileri sunar.',
                en: 'A 10+1 module training that teaches how to read decision-maker roles like CFOs, CTOs, and e-commerce leads at payment companies. It delivers compliance-aware messaging and conversion strategies.'
            }
        }
    },
    {
        path: {
            tr: buildLocalizedTrainingPath('tr', 'trainingB2B'),
            en: buildLocalizedTrainingPath('en', 'trainingB2B')
        },
        productKey: 'training-b2b-sektorunde-buyume',
        title: {
            tr: 'B2B Sektöründe Büyüme Odaklı Pazarlama Eğitimi',
            en: 'Growth-Oriented Marketing Training in the B2B Sector'
        },
        summary: {
            tr: 'B2B firmalar için pazarlama ve satış entegrasyonu eğitim seti.',
            en: 'A training set on marketing and sales integration for B2B companies.'
        },
        aiAnswer: {
            question: {
                tr: 'B2B Sektöründe Büyüme Odaklı Pazarlama Eğitimi nedir?',
                en: 'What is the Growth-Oriented Marketing Training in the B2B Sector?'
            },
            answer: {
                tr: 'B2B firmalarının uzun satış döngüsü ve çok paydaşlı karar alma sürecine odaklanan 10+1 modüllük eğitimdir. Satış ve pazarlama ekiplerini ortak bir dilde buluşturarak lead kalitesini artırır.',
                en: 'A 10+1 module training focused on B2B companies\' long sales cycles and multi-stakeholder decision-making. It aligns marketing and sales teams around a shared language to improve lead quality.'
            }
        }
    },
    {
        path: {
            tr: buildLocalizedTrainingPath('tr', 'trainingFintech'),
            en: buildLocalizedTrainingPath('en', 'trainingFintech')
        },
        productKey: 'training-fintech-sektorunde-buyume',
        title: {
            tr: 'Fintech Sektöründe Büyüme Odaklı Pazarlama Eğitimi',
            en: 'Growth-Oriented Marketing Training in the Fintech Sector'
        },
        summary: {
            tr: 'Fintech odaklı büyüme stratejileri ve kanal optimizasyonu.',
            en: 'Fintech-focused growth strategies and channel optimization.'
        },
        aiAnswer: {
            question: {
                tr: 'Fintech Sektöründe Büyüme Odaklı Pazarlama Eğitimi nedir?',
                en: 'What is the Growth-Oriented Marketing Training in the Fintech Sector?'
            },
            answer: {
                tr: 'Fintech şirketlerinin hızlı büyüme ve düzenleyici uyum baskısı altında pazarlama yapmasını sağlayan 10+1 modüllük eğitimdir. Kanal optimizasyonu ve dönüşüm odaklı içerik stratejisi öğretir.',
                en: 'A 10+1 module training that helps fintech companies market effectively under fast growth and regulatory pressure. It teaches channel optimization and conversion-focused content strategy.'
            }
        }
    },
    {
        path: {
            tr: buildLocalizedTrainingPath('tr', 'trainingTech'),
            en: buildLocalizedTrainingPath('en', 'trainingTech')
        },
        productKey: 'training-teknoloji-yazilim-buyume',
        title: {
            tr: 'Teknoloji & Yazılım Sektöründe Büyüme Odaklı Pazarlama Eğitimi',
            en: 'Growth-Oriented Marketing Training in Tech & Software'
        },
        summary: {
            tr: 'SaaS ve teknoloji markaları için performans odaklı eğitim içeriği.',
            en: 'Performance-oriented training content for SaaS and technology brands.'
        },
        aiAnswer: {
            question: {
                tr: 'Teknoloji & Yazılım Sektöründe Büyüme Odaklı Pazarlama Eğitimi nedir?',
                en: 'What is the Growth-Oriented Marketing Training in Tech & Software?'
            },
            answer: {
                tr: 'SaaS ve teknoloji markalarının ürün-pazar uyumu, aktivasyon ve churn yönetimini ele alan 10+1 modüllük eğitimdir. Performans odaklı büyüme metrikleriyle ekipleri ortak bir stratejiye yönlendirir.',
                en: 'A 10+1 module training covering product-market fit, activation, and churn management for SaaS and technology brands. It aligns teams around performance-driven growth metrics.'
            }
        }
    },
    {
        path: {
            tr: buildLocalizedTrainingPath('tr', 'trainingManufacturing'),
            en: buildLocalizedTrainingPath('en', 'trainingManufacturing')
        },
        productKey: 'training-uretim-sektorunde-buyume',
        title: {
            tr: 'Üretim Sektöründe Büyüme Odaklı Pazarlama Eğitimi',
            en: 'Growth-Oriented Marketing Training in the Manufacturing Sector'
        },
        summary: {
            tr: 'Üretim firmaları için sürdürülebilir talep ve dönüşüm yönetimi.',
            en: 'Sustainable demand and conversion management for manufacturing companies.'
        },
        aiAnswer: {
            question: {
                tr: 'Üretim Sektöründe Büyüme Odaklı Pazarlama Eğitimi nedir?',
                en: 'What is the Growth-Oriented Marketing Training in the Manufacturing Sector?'
            },
            answer: {
                tr: 'Üretim firmalarının uzun teklif süreçlerini ve B2B alıcı yolculuğunu ele alan 10+1 modüllük eğitimdir. Sürdürülebilir talep yaratma ve dönüşüm yönetimi için pratik çerçeveler sunar.',
                en: 'A 10+1 module training addressing manufacturers\' long quote processes and B2B buyer journey. It provides practical frameworks for sustainable demand generation and conversion management.'
            }
        }
    },
    {
        path: {
            tr: buildLocalizedTrainingPath('tr', 'trainingEnergy'),
            en: buildLocalizedTrainingPath('en', 'trainingEnergy')
        },
        productKey: 'training-enerji-sektorunde-buyume',
        title: {
            tr: 'Enerji Sektöründe Büyüme Odaklı Pazarlama Eğitimi',
            en: 'Growth-Oriented Marketing Training in the Energy Sector'
        },
        summary: {
            tr: 'Enerji sektöründe karar verici odaklı pazarlama planlama yaklaşımı.',
            en: 'A decision-maker-focused marketing planning approach for the energy sector.'
        },
        aiAnswer: {
            question: {
                tr: 'Enerji Sektöründe Büyüme Odaklı Pazarlama Eğitimi nedir?',
                en: 'What is the Growth-Oriented Marketing Training in the Energy Sector?'
            },
            answer: {
                tr: 'Enerji sektöründeki karmaşık karar verici yapısını analiz eden 10+1 modüllük eğitimdir. Stratejik kampanya planlaması ve içerik yaklaşımını karar verici odaklı bir sistematiğe oturtur.',
                en: 'A 10+1 module training that analyzes the complex decision-maker structure in the energy sector. It builds strategic campaign planning and content approach around a decision-maker-focused system.'
            }
        }
    },
    {
        path: {
            tr: buildLocalizedTrainingPath('tr', 'trainingDesign'),
            en: buildLocalizedTrainingPath('en', 'trainingDesign')
        },
        productKey: 'training-ofis-kurumsal-ic-tasarim-buyume',
        title: {
            tr: 'Ofis & Kurumsal İç Tasarım Sektöründe Büyüme Odaklı Pazarlama Eğitimi',
            en: 'Growth-Oriented Marketing Training in Corporate Interior Design'
        },
        summary: {
            tr: 'Kurumsal iç tasarım firmaları için tekliften satışa pazarlama modeli.',
            en: 'A marketing model for corporate interior design firms, from proposal to sale.'
        },
        aiAnswer: {
            question: {
                tr: 'Ofis & Kurumsal İç Tasarım Sektöründe Büyüme Odaklı Pazarlama Eğitimi nedir?',
                en: 'What is the Growth-Oriented Marketing Training in Corporate Interior Design?'
            },
            answer: {
                tr: 'Kurumsal iç tasarım firmalarının portföy odaklı satış sürecini ele alan 10+1 modüllük eğitimdir. Tekliften satışa uzanan yolculukta referans yönetimi ve içerik stratejisi öğretir.',
                en: 'A 10+1 module training addressing the portfolio-driven sales process of corporate interior design firms. It teaches referral management and content strategy from proposal to closed sale.'
            }
        }
    },
    {
        path: {
            tr: buildLocalizedTrainingPath('tr', 'trainingFleet'),
            en: buildLocalizedTrainingPath('en', 'trainingFleet')
        },
        productKey: 'training-filo-kiralama-sektorunde-buyume',
        title: {
            tr: 'Filo Kiralama Sektöründe Büyüme Odaklı Pazarlama Eğitimi',
            en: 'Growth-Oriented Marketing Training in Fleet Rental'
        },
        summary: {
            tr: 'Filo kiralama firmalarında lead kalitesi ve dönüşüm yönetimi eğitimi.',
            en: 'Training on lead quality and conversion management for fleet rental companies.'
        },
        aiAnswer: {
            question: {
                tr: 'Filo Kiralama Sektöründe Büyüme Odaklı Pazarlama Eğitimi nedir?',
                en: 'What is the Growth-Oriented Marketing Training in Fleet Rental?'
            },
            answer: {
                tr: 'Filo kiralama firmalarındaki kurumsal mobilite teklif sürecini ele alan 10+1 modüllük eğitimdir. Lead kalitesini artırma ve müşteri elde tutma konularında uygulamalı yöntemler öğretir.',
                en: 'A 10+1 module training addressing the corporate mobility quote process at fleet rental firms. It teaches applied methods for improving lead quality and customer retention.'
            }
        }
    },
    {
        path: {
            tr: buildLocalizedTrainingPath('tr', 'trainingFood'),
            en: buildLocalizedTrainingPath('en', 'trainingFood')
        },
        productKey: 'training-endustriyel-gida-sektorunde-buyume',
        title: {
            tr: 'Endüstriyel Gıda Sektöründe Büyüme Odaklı Pazarlama Eğitimi',
            en: 'Growth-Oriented Marketing Training in Industrial Food'
        },
        summary: {
            tr: 'Endüstriyel gıda sektörüne özel büyüme odaklı pazarlama eğitim akışı.',
            en: 'A growth-oriented marketing training flow tailored to the industrial food sector.'
        },
        aiAnswer: {
            question: {
                tr: 'Endüstriyel Gıda Sektöründe Büyüme Odaklı Pazarlama Eğitimi nedir?',
                en: 'What is the Growth-Oriented Marketing Training in Industrial Food?'
            },
            answer: {
                tr: 'Endüstriyel gıda firmalarının B2B satış kanallarını ve tedarik zinciri dinamiklerini ele alan 10+1 modüllük eğitimdir. Sektöre özel içerik ve kampanya stratejisi kurgulamayı öğretir.',
                en: 'A 10+1 module training addressing industrial food companies\' B2B sales channels and supply chain dynamics. It teaches how to build sector-specific content and campaign strategy.'
            }
        }
    },
    {
        path: {
            tr: buildLocalizedTrainingPath('tr', 'trainingGiftCard'),
            en: buildLocalizedTrainingPath('en', 'trainingGiftCard')
        },
        productKey: 'training-kurumsal-hediye-karti-buyume',
        title: {
            tr: 'Kurumsal Hediye Kartı Sektöründe Büyüme Odaklı Pazarlama Eğitimi',
            en: 'Growth-Oriented Marketing Training for Corporate Gift Card'
        },
        summary: {
            tr: 'Kurumsal hediye kartı sektörüne özel büyüme odaklı pazarlama eğitim akışı.',
            en: 'Growth-oriented marketing training tailored to the corporate gift card sector.'
        },
        aiAnswer: {
            question: {
                tr: 'Kurumsal Hediye Kartı Sektöründe Büyüme Odaklı Pazarlama Eğitimi nedir?',
                en: 'What is the Growth-Oriented Marketing Training for Corporate Gift Card?'
            },
            answer: {
                tr: 'Kurumsal hediye kartı firmalarının B2B satın alma merkezlerini hedefleyen 10+1 modüllük eğitimdir. Kurumsal müşteri ihtiyaçlarına özel kampanya ve içerik kurgusu öğretir.',
                en: 'A 10+1 module training targeting the B2B buying centers of corporate gift card companies. It teaches how to build campaigns and content tailored to corporate customer needs.'
            }
        }
    },
    {
        path: {
            tr: buildLocalizedTrainingPath('tr', 'trainingFuel'),
            en: buildLocalizedTrainingPath('en', 'trainingFuel')
        },
        productKey: 'training-kurumsal-akaryakit-buyume',
        title: {
            tr: 'Kurumsal Akaryakıt Sektöründe Büyüme Odaklı Pazarlama Eğitimi',
            en: 'Growth-Oriented Marketing Training for Corporate Fuel Solutions'
        },
        summary: {
            tr: 'Kurumsal akaryakıt sektörüne özel büyüme odaklı pazarlama eğitim akışı.',
            en: 'Growth-oriented marketing training tailored to the corporate fuel solutions sector.'
        },
        aiAnswer: {
            question: {
                tr: 'Kurumsal Akaryakıt Sektöründe Büyüme Odaklı Pazarlama Eğitimi nedir?',
                en: 'What is the Growth-Oriented Marketing Training for Corporate Fuel Solutions?'
            },
            answer: {
                tr: 'Kurumsal akaryakıt firmalarının filo yöneticilerini hedefleyen 10+1 modüllük eğitimdir. Sektöre özel içerik ve performans planlaması ile pazarlama-satış uyumunu güçlendirir.',
                en: 'A 10+1 module training targeting fleet managers at corporate fuel companies. It strengthens marketing-sales alignment with sector-specific content and performance planning.'
            }
        }
    }
]

function localizeTrainingPrograms(locale: AppLocale): TrainingProgram[] {
    const base = getLocalizedPrograms(locale, trainingProgramCatalog) as Omit<TrainingProgram, 'aiAnswer'>[]
    return base.map((program, index) => ({
        ...program,
        aiAnswer: {
            question: pickLocalizedValue(locale, trainingProgramCatalog[index].aiAnswer.question),
            answer: pickLocalizedValue(locale, trainingProgramCatalog[index].aiAnswer.answer)
        }
    }))
}

export const trainingPrograms: TrainingProgram[] = localizeTrainingPrograms('tr')

export function getTrainingPrograms(locale: AppLocale): TrainingProgram[] {
    return localizeTrainingPrograms(locale)
}
