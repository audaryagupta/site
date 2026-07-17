import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getServerSession } from "next-auth";
import { prisma } from "./prisma";

const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();

// Access level for a signed-in email:
//   "owner"  — the ADMIN_EMAIL account (full control, incl. team management)
//   "member" — an active invited TeamMember (dashboard access, no team mgmt)
//   null     — no admin access
export async function accessLevel(
  email: string | null | undefined
): Promise<"owner" | "member" | null> {
  const e = (email || "").toLowerCase().trim();
  if (!e) return null;
  if (e === adminEmail) return "owner";
  try {
    const m = await prisma.teamMember.findUnique({ where: { email: e } });
    if (m && m.status === "active") return m.role === "owner" ? "owner" : "member";
  } catch {
    // fall through
  }
  return null;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    // Any Google account may sign in (needed for public article comments).
    // Admin-only areas are gated separately via requireAdmin()/requireOwner().
    async signIn({ user }) {
      return Boolean((user.email || "").trim());
    },
    async jwt({ token }) {
      const level = await accessLevel(token.email as string | undefined);
      token.isAdmin = level !== null;
      token.role = level || "none";
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { isAdmin?: boolean; role?: string }).isAdmin =
          Boolean(token.isAdmin);
        (session.user as { isAdmin?: boolean; role?: string }).role =
          (token.role as string) || "none";
      }
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
  },
};

export async function getSession() {
  return getServerSession(authOptions);
}

// Any admin (owner or member) may pass.
export async function requireAdmin() {
  const session = await getSession();
  const level = await accessLevel(session?.user?.email);
  return level ? session : null;
}

// Only the owner may pass (team management, destructive settings).
export async function requireOwner() {
  const session = await getSession();
  const level = await accessLevel(session?.user?.email);
  return level === "owner" ? session : null;
}
