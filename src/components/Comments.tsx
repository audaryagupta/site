"use client";

import { useCallback, useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { LogOut, MessageCircle } from "lucide-react";
import { AuthProvider } from "./AuthProvider";

interface CommentItem {
  id: string;
  authorName: string;
  authorImage: string;
  body: string;
  createdAt: string;
}

function timeAgo(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CommentsInner({ slug }: { slug: string }) {
  const { data: session, status } = useSession();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/comments?slug=${encodeURIComponent(slug)}`);
    const data = await res.json();
    setComments(data.comments || []);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setPosting(true);
    setError("");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not post comment.");
      setComments((c) => [...c, data.comment]);
      setBody("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPosting(false);
    }
  }

  return (
    <section className="mt-16 border-t border-line pt-10">
      <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
        <MessageCircle size={18} /> Comments
        {comments.length > 0 && (
          <span className="text-sm font-normal text-muted">
            ({comments.length})
          </span>
        )}
      </h2>

      <div className="mt-6">
        {status === "authenticated" ? (
          <form onSubmit={submit} className="space-y-3">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share a thought…"
              className="min-h-24 w-full rounded-md border border-line bg-background p-3 text-sm outline-none focus:border-foreground"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">
                Commenting as {session.user?.name || session.user?.email}
                {" · "}
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  <LogOut size={12} /> sign out
                </button>
              </span>
              <button
                type="submit"
                disabled={posting || !body.trim()}
                className="rounded-md bg-foreground px-5 py-2 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
              >
                {posting ? "Posting…" : "Post comment"}
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-md border border-line bg-subtle/50 p-5 text-sm">
            <p className="text-muted">Join the conversation.</p>
            <button
              onClick={() => signIn("google")}
              className="mt-3 rounded-md border border-line bg-background px-4 py-2 font-medium transition hover:bg-subtle"
            >
              Sign in with Google to comment
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 space-y-6">
        {loading ? (
          <p className="text-sm text-muted">Loading comments…</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted">
            No comments yet — be the first to weigh in.
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              {c.authorImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.authorImage}
                  alt=""
                  className="h-9 w-9 flex-none rounded-full border border-line object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-line bg-subtle text-xs">
                  {c.authorName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-medium">
                  {c.authorName}{" "}
                  <span className="ml-1 text-xs font-normal text-muted">
                    {timeAgo(c.createdAt)}
                  </span>
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted">
                  {c.body}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export function Comments({ slug }: { slug: string }) {
  return (
    <AuthProvider>
      <CommentsInner slug={slug} />
    </AuthProvider>
  );
}
