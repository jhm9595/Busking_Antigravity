'use client'

import { useEffect } from 'react'
import { Mail, MapPin, MessageSquare } from 'lucide-react'
import PublicPageLayout from '@/components/common/PublicPageLayout'
import { useLanguage } from '@/contexts/LanguageContext'

function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | miniMic`
  }, [title])
}

export function AboutPageContent() {
  const { t } = useLanguage()
  useDocumentTitle(t('publicPages.about.title'))

  return (
    <>
      <title>{`${t('publicPages.about.title')} | miniMic`}</title>
      <PublicPageLayout title={t('publicPages.about.title')}>
        <section className="space-y-6">
        <p className="text-xl font-medium text-foreground">{t('publicPages.about.lead')}</p>

        <div className="grid gap-8 md:grid-cols-2 mt-12">
          <div className="p-6 rounded-3xl border border-border bg-card shadow-sm">
            <h2 className="text-2xl font-black mb-4 uppercase tracking-tight text-primary">{t('publicPages.about.for_buskers_title')}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('publicPages.about.for_buskers_body')}</p>
          </div>
          <div className="p-6 rounded-3xl border border-border bg-card shadow-sm">
            <h2 className="text-2xl font-black mb-4 uppercase tracking-tight text-primary">{t('publicPages.about.for_fans_title')}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('publicPages.about.for_fans_body')}</p>
          </div>
        </div>

        <div className="mt-12 space-y-6">
          <h2 className="text-3xl font-black uppercase tracking-tighter">{t('publicPages.about.why_title')}</h2>
          <p>{t('publicPages.about.why_body_1')}</p>
          <p>{t('publicPages.about.why_body_2')}</p>
        </div>

        <div className="mt-12 p-8 rounded-[40px] bg-primary/5 border border-primary/10">
          <h2 className="text-2xl font-black mb-4 uppercase tracking-tight text-primary">{t('publicPages.about.features_title')}</h2>
          <ul className="grid gap-4 md:grid-cols-2 list-none p-0">
            {[
              ['feature_setlists_title', 'feature_setlists_body'],
              ['feature_map_title', 'feature_map_body'],
              ['feature_requests_title', 'feature_requests_body'],
              ['feature_support_title', 'feature_support_body'],
            ].map(([titleKey, bodyKey]) => (
              <li key={titleKey} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                <span><strong>{t(`publicPages.about.${titleKey}`)}:</strong> {t(`publicPages.about.${bodyKey}`)}</span>
              </li>
            ))}
          </ul>
        </div>
        </section>
      </PublicPageLayout>
    </>
  )
}

export function PrivacyPageContent() {
  const { t } = useLanguage()
  useDocumentTitle(t('publicPages.privacy.title'))

  return (
    <>
      <title>{`${t('publicPages.privacy.title')} | miniMic`}</title>
      <PublicPageLayout title={t('publicPages.privacy.title')}>
        <section className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-primary">{t('publicPages.privacy.introduction_title')}</h2>
          <p>{t('publicPages.privacy.introduction_body')}</p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-primary">{t('publicPages.privacy.collection_title')}</h2>
          <p>{t('publicPages.privacy.collection_body')}</p>
        </div>

        <div className="space-y-4 p-8 rounded-[40px] bg-primary/5 border border-primary/10">
          <h2 className="text-2xl font-black uppercase tracking-tight text-primary">{t('publicPages.privacy.ads_title')}</h2>
          <p>{t('publicPages.privacy.ads_body_1')}</p>
          <p className="font-bold">{t('publicPages.privacy.ads_body_2')}</p>
          <p>
            {t('publicPages.privacy.ads_body_3')} {' '}
            <a href="https://www.google.com/settings/ads" className="text-primary underline" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>
            {' / '}
            <a href="https://www.aboutads.info" className="text-primary underline" target="_blank" rel="noopener noreferrer">aboutads.info</a>
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-primary">{t('publicPages.privacy.usage_title')}</h2>
          <p>{t('publicPages.privacy.usage_intro')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('publicPages.privacy.usage_item_1')}</li>
            <li>{t('publicPages.privacy.usage_item_2')}</li>
            <li>{t('publicPages.privacy.usage_item_3')}</li>
            <li>{t('publicPages.privacy.usage_item_4')}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-primary">{t('publicPages.privacy.contact_title')}</h2>
          <p>{t('publicPages.privacy.contact_body')}</p>
          <p className="font-black text-primary">support@busking.minibig.pw</p>
        </div>
        </section>
      </PublicPageLayout>
    </>
  )
}

export function TermsPageContent() {
  const { t } = useLanguage()
  useDocumentTitle(t('publicPages.terms.title'))

  return (
    <>
      <title>{`${t('publicPages.terms.title')} | miniMic`}</title>
      <PublicPageLayout title={t('publicPages.terms.title')}>
        <section className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-primary">{t('publicPages.terms.acceptance_title')}</h2>
          <p>{t('publicPages.terms.acceptance_body')}</p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-primary">{t('publicPages.terms.acceptable_title')}</h2>
          <p>{t('publicPages.terms.acceptable_intro')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('publicPages.terms.acceptable_item_1')}</li>
            <li>{t('publicPages.terms.acceptable_item_2')}</li>
            <li>{t('publicPages.terms.acceptable_item_3')}</li>
            <li>{t('publicPages.terms.acceptable_item_4')}</li>
            <li>{t('publicPages.terms.acceptable_item_5')}</li>
          </ul>
        </div>

        <div className="space-y-4 p-8 rounded-[40px] bg-primary/5 border border-primary/10">
          <h2 className="text-2xl font-black uppercase tracking-tight text-primary">{t('publicPages.terms.performers_title')}</h2>
          <p>{t('publicPages.terms.performers_body')}</p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-primary">{t('publicPages.terms.points_title')}</h2>
          <p>{t('publicPages.terms.points_body')}</p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-primary">{t('publicPages.terms.termination_title')}</h2>
          <p>{t('publicPages.terms.termination_body')}</p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-primary">{t('publicPages.terms.contact_title')}</h2>
          <p>{t('publicPages.terms.contact_body')}</p>
          <p className="font-black text-primary">support@busking.minibig.pw</p>
        </div>
        </section>
      </PublicPageLayout>
    </>
  )
}

export function ContactPageContent() {
  const { t } = useLanguage()
  useDocumentTitle(t('publicPages.contactPage.title'))

  return (
    <>
      <title>{`${t('publicPages.contactPage.title')} | miniMic`}</title>
      <PublicPageLayout title={t('publicPages.contactPage.title')}>
        <section className="space-y-12">
        <div className="space-y-6">
          <p className="text-xl font-medium text-foreground">{t('publicPages.contactPage.lead')}</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="p-8 rounded-[40px] border border-border bg-card shadow-sm flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-primary">{t('publicPages.contactPage.email_title')}</h2>
            <p className="text-sm text-muted-foreground">{t('publicPages.contactPage.email_body')}</p>
            <p className="text-xl font-black text-primary break-all">support@busking.minibig.pw</p>
            <p className="text-xs text-muted-foreground italic">{t('publicPages.contactPage.email_response')}</p>
          </div>

          <div className="p-8 rounded-[40px] border border-border bg-card shadow-sm flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-primary">{t('publicPages.contactPage.feedback_title')}</h2>
            <p className="text-sm text-muted-foreground">{t('publicPages.contactPage.feedback_body')}</p>
            <p className="text-sm font-bold">{t('publicPages.contactPage.feedback_note')}</p>
          </div>
        </div>

        <div className="p-8 rounded-[40px] bg-primary/5 border border-primary/10 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-primary">{t('publicPages.contactPage.location_title')}</h2>
              <p className="text-sm text-muted-foreground">{t('publicPages.contactPage.location_body_1')}</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed">{t('publicPages.contactPage.location_body_2')}</p>
        </div>
        </section>
      </PublicPageLayout>
    </>
  )
}
