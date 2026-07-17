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

const themes = [
  ["Finance", "Markets, business models, incentives and the stories behind capital."],
  ["Public life", "Governance, institutions and the ideas that shape decisions."],
  ["Writing", "Turning research and observation into essays people can return to."],
];

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
  const portrait = settings.about_image || "/audarya/audarya-portrait-blue.jpg";

  return (
    <Container className="py-16 lg:py-20">
      <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
        <aside className="lg:sticky lg:top-24">
          <div className="overflow-hidden rounded-[1.5rem] border border-line bg-card shadow-xl shadow-foreground/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={portrait}
              alt={title}
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
          <div className="mt-6 rounded-2xl border border-line bg-card p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-muted">
              Connect
            </p>
            <p className="mt-3 font-serif text-muted">
              Essays, collaborations, speaking requests and appointments start
              with a simple message.
            </p>
            <div className="mt-5">
              <SocialIcons size={20} />
            </div>
          </div>
        </aside>

        <main>
          <p className="text-xs uppercase tracking-[0.25em] text-muted">
            About Me
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
            {title}
          </h1>
          <p className="mt-3 font-serif text-xl italic text-muted">{role}</p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {themes.map(([label, copy]) => (
              <div key={label} className="rounded-2xl border border-line p-4">
                <h2 className="font-display text-lg font-semibold">{label}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{copy}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 space-y-5 font-serif text-lg leading-relaxed">
            {bio.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </main>
      </div>
    </Container>
  );
}
