import type { Metadata } from "next";
import Link from "next/link";
import PublicPageLayout from "@/components/common/PublicPageLayout";
import { getAllGuides } from "@/content/guides";

export const metadata: Metadata = {
  title: "Busking Guides | miniMic",
  description:
    "Browse practical busking guides for performers and audiences, including preparation, communication, sponsorship, and operations tips.",
  alternates: {
    canonical: "/guides",
  },
};

export default function GuidesIndexPage() {
  const guideEntries = getAllGuides();

  return (
    <PublicPageLayout title="Guides">
      <section className="space-y-6">
        <p className="text-lg text-foreground/90">
          miniMic guides are public, crawlable reference articles for buskers and
          audiences. This hub is structured for long-form updates and currently
          provides starter content for all planned topics.
        </p>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="font-semibold">Helpful links:</span>
          <Link className="underline underline-offset-4" href="/about">
            About
          </Link>
          <Link className="underline underline-offset-4" href="/privacy">
            Privacy
          </Link>
          <Link className="underline underline-offset-4" href="/terms">
            Terms
          </Link>
          <Link className="underline underline-offset-4" href="/contact">
            Contact
          </Link>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 mt-10">
        {guideEntries.map((guide) => (
          <article
            key={guide.slug}
            className="rounded-3xl border border-border bg-card p-6 shadow-sm"
          >
            <h2 className="text-2xl font-black tracking-tight text-primary">
              <Link href={`/guides/${guide.slug}`} className="hover:underline">
                {guide.title}
              </Link>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {guide.excerpt}
            </p>
            <p className="mt-4 text-xs text-foreground/70">{guide.description}</p>
            <Link
              className="mt-5 inline-flex text-sm font-bold text-primary underline underline-offset-4"
              href={`/guides/${guide.slug}`}
            >
              Read guide
            </Link>
          </article>
        ))}
      </section>
    </PublicPageLayout>
  );
}
