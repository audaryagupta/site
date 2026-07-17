"use client";

import { signIn } from "next-auth/react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginInner() {
  const params = useSearchParams();
  const error = params.get("error");
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm text-center">
        <p className="font-display text-3xl">
          <span className="italic">by</span>{" "}
          <span className="tracking-[0.18em]">AUDARYA</span>
        </p>
        <h1 className="mt-8 font-display text-2xl font-semibold">
          Studio sign-in
        </h1>
        <p className="mt-2 text-sm text-muted">
          Restricted to Audarya&apos;s account.
        </p>
        {error && (
          <p className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-600">
            {error === "AccessDenied"
              ? "That account isn't authorized."
              : "Sign-in failed. Try again."}
          </p>
        )}
        <button
          onClick={() => signIn("google", { callbackUrl: "/admin" })}
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-line bg-foreground text-sm font-medium text-background transition hover:opacity-90"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
