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

const moments = [
  ["Finance", "Markets, business models, incentives and the stories behind capital."],
  ["Public life", "Governance, institutions and the ideas that shape decisions."],
  ["Curiosity", "Languages, history, technology, books and field notes from travel."],
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
    <>
      <section className="relative overflow-hidden border-b border-line bg-subtle/35">
        <Container className="grid gap-12 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:py-20">
          <div className="relative h-[560px] max-h-[76vh]">
            <div className="absolute inset-x-10 top-0 h-[84%] overflow-hidden rounded-[2rem] border border-line bg-card shadow-2xl shadow-foreground/10 lg:left-0 lg:right-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={portrait}
                alt={title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute bottom-0 right-0 w-56 overflow-hidden rounded-2xl border-4 border-background bg-card shadow-xl shadow-foreground/15">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/audarya/audarya-parliament-wide.jpg"
                alt="Audarya Gupta at Parliament House"
                className="h-64 w-full object-cover"
              />
            </div>
          </div>

          <div className="animate-fade-up">
            <p className="text-xs uppercase tracking-[0.25em] text-muted">
              About Me
            </p>
            <h1 className="mt-4 max-w-2xl font-display text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
              {title}
            </h1>
            <p className="mt-3 font-serif text-xl italic text-muted">{role}</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {moments.map(([label, copy]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-line bg-background/70 p-4 backdrop-blur"
                >
                  <h2 className="font-display text-lg font-semibold">{label}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <Container className="grid gap-12 py-16 lg:grid-cols-[1fr_0.7fr]">
        <div className="space-y-5 font-serif text-lg leading-relaxed">
          {bio.split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
        <aside className="space-y-6">
          <div className="rounded-2xl border border-line bg-card p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-muted">
              Connect
            </p>
            <p className="mt-3 font-serif text-muted">
              Essays, collaborations, speaking requests and appointments all
              start with a simple message.
            </p>
            <div className="mt-5">
              <SocialIcons size={20} />
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-line bg-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/audarya/audarya-car.jpg"
              alt="Audarya with a model car"
              className="h-72 w-full object-cover"
            />
          </div>
        </aside>
      </Container>
    </>
  );
}
