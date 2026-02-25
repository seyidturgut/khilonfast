import {
  HiBolt,
  HiChartBar,
  HiCheckBadge,
  HiClipboardDocumentList,
  HiKey,
  HiMagnifyingGlass,
  HiSparkles,
  HiRocketLaunch,
  HiGlobeAlt,
  HiLightBulb
} from 'react-icons/hi2'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Breadcrumbs from '../components/Breadcrumbs'
import FAQ from '../components/FAQ'
import './HowItWorks.css'

export default function HowItWorks() {
  const { t, i18n } = useTranslation('common');
  const currentLang = i18n.language.split('-')[0];
  const langPrefix = currentLang === 'en' ? '/en' : '';
  const toLocalized = (key: string) => `${langPrefix}/${t(`slugs.${key}`)}`.replace(/\/{2,}/g, '/');
  const withLang = (path: string) => `${langPrefix}${path}`.replace(/\/{2,}/g, '/');

  const processSteps = [
    {
      title: t('howItWorksPage.steps.item1.title'),
      description: t('howItWorksPage.steps.item1.desc'),
      icon: <HiBolt />
    },
    {
      title: t('howItWorksPage.steps.item2.title'),
      description: t('howItWorksPage.steps.item2.desc'),
      icon: <HiKey />
    },
    {
      title: t('howItWorksPage.steps.item3.title'),
      description: t('howItWorksPage.steps.item3.desc'),
      icon: <HiClipboardDocumentList />
    },
    {
      title: t('howItWorksPage.steps.item4.title'),
      description: t('howItWorksPage.steps.item4.desc'),
      icon: <HiMagnifyingGlass />
    },
    {
      title: t('howItWorksPage.steps.item5.title'),
      description: t('howItWorksPage.steps.item5.desc'),
      icon: <HiCheckBadge />
    }
  ]

  const authorizationLinks = [
    {
      title: t('howItWorksPage.auth.item1.title'),
      description: t('howItWorksPage.auth.item1.desc'),
      path: withLang('/google-analytics-kurulum-akisi')
    },
    {
      title: t('howItWorksPage.auth.item2.title'),
      description: t('howItWorksPage.auth.item2.desc'),
      path: withLang('/google-tag-manager-kurulum-akisi')
    },
    {
      title: t('howItWorksPage.auth.item3.title'),
      description: t('howItWorksPage.auth.item3.desc'),
      path: toLocalized('idm')
    },
    {
      title: t('howItWorksPage.auth.item4.title'),
      description: t('howItWorksPage.auth.item4.desc'),
      path: withLang('/search-ads-google-reklamlari-kurulum-akisi')
    },
    {
      title: t('howItWorksPage.auth.item5.title'),
      description: t('howItWorksPage.auth.item5.desc'),
      path: withLang('/hizmetlerimiz/google-search-console-kurulum-akisi')
    },
    {
      title: t('howItWorksPage.auth.item6.title'),
      description: t('howItWorksPage.auth.item6.desc'),
      path: withLang('/meta-facebook-instagram-reklamlari-kurulum-akisi')
    },
    {
      title: t('howItWorksPage.auth.item7.title'),
      description: t('howItWorksPage.auth.item7.desc'),
      path: withLang('/linkedin-reklamlari-kurulum-akisi-khilonfast')
    },
    {
      title: t('howItWorksPage.auth.item8.title'),
      description: t('howItWorksPage.auth.item8.desc'),
      path: withLang('/tiktok-kurulum-akisi')
    }
  ]

  const valueCards = [
    {
      title: t('howItWorksPage.values.item1.title'),
      subtitle: t('howItWorksPage.values.item1.sub'),
      description: t('howItWorksPage.values.item1.desc'),
      icon: <HiGlobeAlt />
    },
    {
      title: t('howItWorksPage.values.item2.title'),
      subtitle: t('howItWorksPage.values.item2.sub'),
      description: t('howItWorksPage.values.item2.desc'),
      icon: <HiRocketLaunch />
    },
    {
      title: t('howItWorksPage.values.item3.title'),
      subtitle: t('howItWorksPage.values.item3.sub'),
      description: t('howItWorksPage.values.item3.desc'),
      icon: <HiChartBar />
    },
    {
      title: t('howItWorksPage.values.item4.title'),
      subtitle: t('howItWorksPage.values.item4.sub'),
      description: t('howItWorksPage.values.item4.desc'),
      icon: <HiSparkles />
    },
    {
      title: t('howItWorksPage.values.item5.title'),
      subtitle: t('howItWorksPage.values.item5.sub'),
      description: t('howItWorksPage.values.item5.desc'),
      icon: <HiLightBulb />
    }
  ]

  return (
    <div className="page-container how-it-works-page">
      <section className="how-hero">
        <Breadcrumbs
          items={[
            { label: t('header.home'), path: '/' },
            { label: t('header.howItWorks') }
          ]}
        />
        <div className="container how-hero-grid">
          <div className="how-hero-content">
            <span className="how-hero-kicker">{t('howItWorksPage.hero.kicker')}</span>
            <h1>{t('howItWorksPage.hero.title')}</h1>
            <p>
              {t('howItWorksPage.hero.description')}
            </p>
            <div className="how-hero-actions">
              <a href="#adimlar" className="btn-service-primary">{t('common.discover')}</a>
              <Link to={toLocalized('idm')} className="btn-service-secondary">
                {t('header.services')}
              </Link>
            </div>
            <div className="how-hero-tags">
              <span>{t('howItWorksPage.hero.tag1')}</span>
              <span>{t('howItWorksPage.hero.tag2')}</span>
              <span>{t('howItWorksPage.hero.tag3')}</span>
            </div>
          </div>
          <div className="how-hero-video">
            <img
              src="/TR_nasilcalisir.avif"
              alt={t('howItWorksPage.hero.title')}
            />
          </div>
        </div>
      </section>

      <section id="adimlar" className="how-steps">
        <div className="container">
          <div className="how-section-head">
            <span>{t('howItWorksPage.steps.kicker')}</span>
            <h2>{t('howItWorksPage.steps.title')}</h2>
            <p>{t('howItWorksPage.steps.description')}</p>
          </div>
          <div className="how-steps-grid">
            {processSteps.map((step, index) => (
              <article key={step.title} className="how-step-card">
                <div className="how-step-top">
                  <span className="how-step-index">{t('common.readMore')} {index + 1}</span>
                  <div className="how-step-icon">{step.icon}</div>
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="how-auth">
        <div className="container">
          <div className="how-section-head">
            <span>{t('howItWorksPage.auth.kicker')}</span>
            <h2>{t('howItWorksPage.auth.title')}</h2>
            <p>{t('howItWorksPage.auth.description')}</p>
          </div>
          <div className="how-auth-video">
            <iframe
              src="https://player.vimeo.com/showcase/11932505/embed"
              title={t('howItWorksPage.auth.videoTitle')}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="how-auth-grid">
            {authorizationLinks.map((item) => (
              <article key={item.title} className="how-auth-card">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <Link to={item.path}>{t('common.discover').toUpperCase()}</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="how-values">
        <div className="container">
          <div className="how-section-head">
            <span>{t('howItWorksPage.values.kicker')}</span>
            <h2>{t('howItWorksPage.values.title')}</h2>
            <p>
              {t('howItWorksPage.values.description')}
            </p>
          </div>
          <div className="how-values-grid">
            {valueCards.map((item) => (
              <article key={item.title} className="how-value-card">
                <div className="how-value-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <h4>{item.subtitle}</h4>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <FAQ
        subtitle={t('faq.subtitle')}
      />
    </div>
  )
}
