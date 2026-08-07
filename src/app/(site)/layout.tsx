import { Suspense } from "react";
import { headers } from "next/headers";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ComingSoon } from "@/components/ComingSoon";
import { VisitTracker } from "@/components/VisitTracker";
import { SiteEditorBar } from "@/components/site-editor/SiteEditorBar";
import { getSettings } from "@/lib/queries";
import { getSiteContent, pickStr } from "@/lib/siteContent";

// Pre-launch, the primary production domain shows a teaser until you "Go live"
// from the console. Any other host (e.g. the temporary *.fly.dev URL) always
// shows the full site so you can preview everything.
const primaryHost = (process.env.NEXT_PUBLIC_PRIMARY_HOST || "")
  .toLowerCase()
  .trim();

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const host = (headers().get("host") || "").toLowerCase().split(":")[0];
  const onPrimary = Boolean(primaryHost) && host === primaryHost;

  if (onPrimary) {
    const settings = await getSettings(["site_live", "launch_at"]);
    if (settings.site_live !== "true") {
      const content = await getSiteContent();
      return (
        <ComingSoon
          launchAt={settings.launch_at || undefined}
          eyebrow={pickStr(content, "coming.eyebrow", "Coming soon")}
          heading={pickStr(content, "coming.heading", "A new home for the writing is on its way.")}
          body={pickStr(content, "coming.body", "Essays, dispatches and curiosities about the world and everything in it. Leave your email and you'll be the first to know when it goes live.")}
        />
      );
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={null}>
        <VisitTracker />
      </Suspense>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <SiteEditorBar />
    </div>
  );
}
