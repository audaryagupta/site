import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { SocialIcons } from "@/components/SocialIcons";
import { getSettings } from "@/lib/queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "About Me",
  description: "About Audarya Gupta — writer, founder, and lifelong learner.",
};

const DEFAULT_BIO = `Hi, I’m Audarya — someone who has always been fascinated by the forces that drive economies, shape global affairs, and influence financial markets. My curiosity about finance, geopolitics, and history led me to take a gap year after my 12th grade and go down the exploration road. In the past I've interned at organizations like the Government of India, Hindustan Times, and Gulf News Dubai, gaining insights into finance, media, and governance along the way.

I have an ever-going quest to share whatever knowledge I have. I believe any information that leaves you becomes 2x more useful than it would have been constricted to you — which led me to start The VentureBuz Forum to support students in developing entrepreneurial skills through competitions and business clubs. My passion for finance and problem-solving also led me to author a book.

Apart from these pursuits, I enjoy learning languages — I speak French semi-fluently and am currently learning Spanish and Sanskrit to expand my global perspective. Through this blog, I hope to share my insights on finance, innovation, history, and geopolitics while documenting my journey of continuous learning.

I look forward to engaging with you all. Please don’t hesitate to reach out.`;

export default async function AboutPage() {
  const settings = await getSettings([
    "about_bio",
    "about_title",
    "about_role",
    "about_image",
  ]);
  const bio = settings.about_bio || DEFAULT_BIO;
  const title = settings.about_title || "Audarya Gupta";
  const role = settings.about_role || "Founder, byAudarya & VentureBuz";

  return (
    <Container className="py-16">
      <div className="grid gap-12 md:grid-cols-[0.9fr_1.4fr]">
        <div>
          {/* Image slot — set "about_image" in the dashboard */}
          <div className="aspect-[4/5] overflow-hidden rounded-sm border border-line bg-subtle">
            {settings.about_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.about_image}
                alt={title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="font-display text-3xl italic text-muted/50">
                  by AUDARYA
                </span>
              </div>
            )}
          </div>
          <div className="mt-6">
            <SocialIcons size={20} />
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted">
            About Me
          </p>
          <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="mt-2 font-serif text-lg italic text-muted">{role}</p>

          <div className="mt-8 space-y-5 font-serif text-lg leading-relaxed">
            {bio.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}
