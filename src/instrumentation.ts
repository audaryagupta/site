// Runs once when the server boots. Starts a lightweight ticker that pokes the
// scheduled-email cron endpoint over localhost, so scheduling works without an
// external cron. Kept dependency-free (just fetch + env) so it stays edge-safe
// and never pulls heavy modules into the instrumentation bundle. The Fly app
// keeps at least one machine running, so the interval stays alive.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.DISABLE_EMAIL_SCHEDULER === "1") return;

  const secret = process.env.CRON_SECRET;
  if (!secret) return;
  const port = process.env.PORT || "3000";
  const url = `http://127.0.0.1:${port}/api/cron/send-scheduled`;

  const tick = async () => {
    try {
      await fetch(url, {
        method: "POST",
        headers: { authorization: `Bearer ${secret}` },
      });
    } catch {
      // Never let the ticker crash the process.
    }
  };
  // Delay past boot (so the HTTP server is listening), then poll every minute.
  setTimeout(() => {
    void tick();
    setInterval(() => void tick(), 60_000);
  }, 20_000);
}
