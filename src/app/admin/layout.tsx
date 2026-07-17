import { requireAdmin } from "@/lib/auth";
import { AuthProvider } from "@/components/AuthProvider";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  // Unauthenticated users only ever reach the login page here (middleware
  // redirects every other /admin route to /admin/login).
  if (!session) {
    return <AuthProvider>{children}</AuthProvider>;
  }

  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-background">
        <AdminNav email={session.user?.email} />
        <div className="flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-5xl px-8 py-10">{children}</div>
        </div>
      </div>
    </AuthProvider>
  );
}
