import { requireOwner } from "@/lib/auth";
import { AccessManager } from "./AccessManager";

export const dynamic = "force-dynamic";

export default async function AccessPage() {
  const session = await requireOwner();
  if (!session) {
    return (
      <div>
        <h1 className="font-display text-2xl font-semibold">Access</h1>
        <p className="mt-2 text-sm text-muted">
          Only the account owner can manage dashboard access.
        </p>
      </div>
    );
  }
  return <AccessManager />;
}
