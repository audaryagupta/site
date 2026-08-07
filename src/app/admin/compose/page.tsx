import { Composer } from "@/components/admin/Composer";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ComposePage() {
  const session = await getSession();
  const ownerEmail = (session?.user?.email || "").toLowerCase();
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Compose email</h1>
      <p className="mt-1 text-sm text-muted">
        Write a message, pick who it goes to, and it&apos;s wrapped in your branded
        template (banner &amp; signature) and sent from your personal mailbox.
      </p>
      <div className="mt-8">
        <Composer ownerEmail={ownerEmail} />
      </div>
    </div>
  );
}
