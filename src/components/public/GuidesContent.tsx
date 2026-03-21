'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import PublicPageLayout from '@/components/common/PublicPageLayout'
import { getAllGuides, getGuideBySlug, getRelatedGuides, type GuideLanguage } from '@/content/guides'
import { useLanguage } from '@/contexts/LanguageContext'

function useGuideLanguage(): GuideLanguage {
  const { language } = useLanguage()
  return language
}

function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | miniMic`
  }, [title])
}

export function GuidesIndexContent() {
  const { t } = useLanguage()
  const guideLanguage = useGuideLanguage()
  const guideEntries = getAllGuides(guideLanguage)
  useDocumentTitle(t('publicPages.guides.title'))

  return (
    <>
      <title>{`${t('publicPages.guides.title')} | miniMic`}</title>
      <PublicPageLayout title={t('publicPages.guides.title')}>
        <section className="space-y-6">
        <p className="text-lg text-foreground/90">{t('publicPages.guides.intro')}</p>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="font-semibold">{t('publicPages.guides.helpful_links')}</span>
          <Link className="underline underline-offset-4" href="/about">{t('publicPages.footer.about')}</Link>
          <Link className="underline underline-offset-4" href="/privacy">{t('publicPages.footer.privacy')}</Link>
          <Link className="underline underline-offset-4" href="/terms">{t('publicPages.footer.terms')}</Link>
          <Link className="underline underline-offset-4" href="/contact">{t('publicPages.footer.contact')}</Link>
        </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 mt-10">
        {guideEntries.map((guide) => (
          <article key={guide.slug} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-primary">
              <Link href={`/guides/${guide.slug}`} className="hover:underline">{guide.title}</Link>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{guide.excerpt}</p>
            <p className="mt-4 text-xs text-foreground/70">{guide.description}</p>
            <Link className="mt-5 inline-flex text-sm font-bold text-primary underline underline-offset-4" href={`/guides/${guide.slug}`}>
              {t('publicPages.guides.read_guide')}
            </Link>
          </article>
        ))}
        </section>
      </PublicPageLayout>
    </>
  )
}

export function GuideDetailContent({ slug }: { slug: string }) {
  const { t } = useLanguage()
  const guideLanguage = useGuideLanguage()
  const guide = getGuideBySlug(slug, guideLanguage)

  useDocumentTitle(guide ? guide.title : t('publicPages.guides.title'))

  if (!guide) {
    return null
  }

  const relatedGuides = getRelatedGuides(guide, guideLanguage, 3)

  return (
    <>
      <title>{`${guide.title} | ${t('publicPages.guides.title')}`}</title>
      <PublicPageLayout title={guide.title}>
        <article className="space-y-8">
        <header className="space-y-4 border-b border-border pb-6">
          <p className="text-lg text-foreground/90">{guide.excerpt}</p>
          <p className="text-sm text-muted-foreground">{guide.description}</p>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <Link href="/guides" className="underline underline-offset-4">{t('publicPages.guides.back_to_all')}</Link>
            <Link href="/about" className="underline underline-offset-4">{t('publicPages.footer.about')}</Link>
            <Link href="/privacy" className="underline underline-offset-4">{t('publicPages.footer.privacy')}</Link>
            <Link href="/terms" className="underline underline-offset-4">{t('publicPages.footer.terms')}</Link>
            <Link href="/contact" className="underline underline-offset-4">{t('publicPages.footer.contact')}</Link>
          </div>
        </header>

        <section className="space-y-4">
          <h2 className="text-2xl font-black tracking-tight text-primary">{t('publicPages.guides.introduction')}</h2>
          <p>{guide.body.intro}</p>
        </section>

        {guide.body.sections.map((section) => (
          <section key={section.heading} className="space-y-4">
            <h2 className="text-2xl font-black tracking-tight text-primary">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.checklist && section.checklist.length > 0 ? (
              <ul className="list-disc space-y-2 pl-6">
                {section.checklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        <section className="space-y-3 border-t border-border pt-6">
          <h2 className="text-2xl font-black tracking-tight text-primary">{t('publicPages.guides.closing')}</h2>
          <p>{guide.body.closing}</p>
        </section>

        <section className="space-y-4 rounded-3xl border border-border bg-card p-6">
          <h2 className="text-2xl font-black tracking-tight text-primary">{t('publicPages.guides.related_guides')}</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {relatedGuides.map((relatedGuide) => (
              <article key={relatedGuide.slug} className="rounded-2xl border border-border p-4">
                <h3 className="font-black text-base text-foreground">
                  <Link href={`/guides/${relatedGuide.slug}`} className="hover:underline">{relatedGuide.title}</Link>
                </h3>
                <p className="mt-2 text-xs text-muted-foreground">{relatedGuide.excerpt}</p>
              </article>
            ))}
          </div>
        </section>
        </article>
      </PublicPageLayout>
    </>
  )
}
