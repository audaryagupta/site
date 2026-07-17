import { Instagram, Linkedin, Youtube } from "lucide-react";
import { site } from "@/lib/site";

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const iconMap: Record<string, (p: { size?: number }) => JSX.Element> = {
  instagram: (p) => <Instagram size={p.size ?? 16} />,
  linkedin: (p) => <Linkedin size={p.size ?? 16} />,
  youtube: (p) => <Youtube size={p.size ?? 16} />,
  x: (p) => <XIcon size={p.size ?? 16} />,
};

export function SocialIcons({ size = 16 }: { size?: number }) {
  return (
    <ul className="flex items-center gap-3">
      {site.socials.map((s) => {
        const Icon = iconMap[s.key];
        return (
          <li key={s.key}>
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="text-muted transition hover:text-foreground"
            >
              {Icon ? Icon({ size }) : s.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
