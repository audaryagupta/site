"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export function DeleteArticleButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function del() {
    if (!confirm("Delete this writing permanently?")) return;
    setBusy(true);
    await fetch(`/api/admin/articles/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      onClick={del}
      disabled={busy}
      aria-label="Delete"
      className="text-muted transition hover:text-red-500 disabled:opacity-50"
    >
      <Trash2 size={16} />
    </button>
  );
}
