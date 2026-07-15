import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "الإيميل", type: "email" },
        password: { label: "كلمة السر", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) return null;
        if (user.deletedAt) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as string,
          canPost: user.canPost,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.canPost = (user as any).canPost;
      }
      // Refresh role/canPost from DB on each JWT creation (not every call)
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).canPost = token.canPost;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};

/**
 * Returns the session if the user is authenticated, otherwise null.
 * The caller is responsible for returning a 401 response when null.
 */
export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return session;
}

/**
 * Returns the session if the user is an authenticated MEMBER, otherwise null.
 * The caller is responsible for returning a 401/403 response when null.
 */
export async function requireMember() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  if (session.user.role !== "MEMBER") return null;
  return session;
}
