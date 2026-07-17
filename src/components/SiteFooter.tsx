import Link from "next/link";
import { site } from "@/lib/site";
import { Container } from "./Container";
import { SocialIcons } from "./SocialIcons";
import { SubscribeForm } from "./SubscribeForm";
import { EasterEggs } from "./EasterEggs";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-subtle/60">
      <Container className="grid gap-12 py-14 md:grid-cols-[1.5fr_1fr_1.5fr]">
        <div>
          <p className="font-display text-xl">
            <span className="italic">by</span>{" "}
            <span className="tracking-[0.18em]">AUDARYA</span>
          </p>
          <p className="mt-3 max-w-xs text-sm text-muted">{site.tagline}.</p>
          <div className="mt-5">
            <SocialIcons size={18} />
          </div>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-widest text-muted">
            Explore
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            {site.nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="text-muted hover:text-foreground">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-widest text-muted">
            The Friday Recap
          </h4>
          <p className="mt-4 text-sm text-muted">
            The week&apos;s ten best stories in finance, business & tech —
            curated, every Friday.
          </p>
          <div className="mt-4">
            <SubscribeForm compact />
          </div>
        </div>
      </Container>

      <div className="border-t border-line">
        <Container className="flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted sm:flex-row">
          <p>
            © {new Date().getFullYear()} byAudarya. All rights reserved.
            {/* hidden easter-egg entry point */}
            <Link
              href="/the-signal"
              aria-hidden="true"
              tabIndex={-1}
              className="ml-1 opacity-0 transition-opacity hover:opacity-40"
            >
              ✦
            </Link>
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <a
              href={`mailto:${site.email}`}
              className="hover:text-foreground"
            >
              {site.email}
            </a>
          </div>
        </Container>
      </div>
      <EasterEggs />
    </footer>
  );
}
