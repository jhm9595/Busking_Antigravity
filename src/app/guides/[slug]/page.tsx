import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicPageLayout from "@/components/common/PublicPageLayout";
import {
  getAllGuides,
  getGuideBySlug,
  getRelatedGuides,
} from "@/content/guides";

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllGuides().map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return {
      title: "Guide Not Found | miniMic",
      description: "The requested guide could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `${guide.title} | miniMic Guides`,
    description: guide.description,
    alternates: {
      canonical: `/guides/${guide.slug}`,
    },
    openGraph: {
      title: `${guide.title} | miniMic Guides`,
      description: guide.description,
      type: "article",
      url: `/guides/${guide.slug}`,
    },
  };
}

export default async function GuideDetailPage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  const relatedGuides = getRelatedGuides(guide, 3);

  return (
    <PublicPageLayout title={guide.title}>
      <article className="space-y-8">
        <header className="space-y-4 border-b border-border pb-6">
          <p className="text-lg text-foreground/90">{guide.excerpt}</p>
          <p className="text-sm text-muted-foreground">{guide.description}</p>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <Link href="/guides" className="underline underline-offset-4">
              Back to all guides
            </Link>
            <Link href="/about" className="underline underline-offset-4">
              About
            </Link>
            <Link href="/privacy" className="underline underline-offset-4">
              Privacy
            </Link>
            <Link href="/terms" className="underline underline-offset-4">
              Terms
            </Link>
            <Link href="/contact" className="underline underline-offset-4">
              Contact
            </Link>
          </div>
        </header>

        <section className="space-y-4">
          <h2 className="text-2xl font-black tracking-tight text-primary">Introduction</h2>
          <p>{guide.body.intro}</p>
        </section>

        {guide.body.sections.map((section) => (
          <section key={section.heading} className="space-y-4">
            <h2 className="text-2xl font-black tracking-tight text-primary">
              {section.heading}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.checklist && section.checklist.length > 0 ?
              <ul className="list-disc space-y-2 pl-6">
                {section.checklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            : null}
          </section>
        ))}

        <section className="space-y-3 border-t border-border pt-6">
          <h2 className="text-2xl font-black tracking-tight text-primary">Closing</h2>
          <p>{guide.body.closing}</p>
        </section>

        <section className="space-y-4 rounded-3xl border border-border bg-card p-6">
          <h2 className="text-2xl font-black tracking-tight text-primary">Related guides</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {relatedGuides.map((relatedGuide) => (
              <article key={relatedGuide.slug} className="rounded-2xl border border-border p-4">
                <h3 className="font-black text-base text-foreground">
                  <Link href={`/guides/${relatedGuide.slug}`} className="hover:underline">
                    {relatedGuide.title}
                  </Link>
                </h3>
                <p className="mt-2 text-xs text-muted-foreground">{relatedGuide.excerpt}</p>
              </article>
            ))}
          </div>
        </section>
      </article>
    </PublicPageLayout>
  );
}
