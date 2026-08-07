import { Suspense } from "react";
import { EmailSettings } from "@/components/admin/EmailSettings";

export const dynamic = "force-dynamic";

export default function EmailSettingsPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Email</h1>
      <p className="mt-1 text-sm text-muted">
        Connect your sending mailboxes and set the banner &amp; signature used on
        composed and greeting mail.
      </p>
      <div className="mt-8">
        <Suspense fallback={<p className="text-muted">Loading…</p>}>
          <EmailSettings />
        </Suspense>
      </div>
    </div>
  );
}
