import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getServerSession } from "next-auth";

const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();

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
    // Only the configured admin (Audarya's GSuite account) may sign in.
    async signIn({ user }) {
      if (!adminEmail) return false;
      return (user.email || "").toLowerCase().trim() === adminEmail;
    },
    async jwt({ token }) {
      token.isAdmin =
        (token.email || "").toLowerCase().trim() === adminEmail;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { isAdmin?: boolean }).isAdmin = Boolean(
          token.isAdmin
        );
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

export async function requireAdmin() {
  const session = await getSession();
  const email = (session?.user?.email || "").toLowerCase().trim();
  if (!email || email !== adminEmail) return null;
  return session;
}
