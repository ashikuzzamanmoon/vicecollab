import { PrismaAdapter } from "@auth/prisma-adapter";
import { decode as defaultDecode } from "@auth/core/jwt";
import type { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET;

const providers = [
  Credentials({
    name: "Email and password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(rawCredentials) {
      const parsed = credentialsSchema.safeParse(rawCredentials);
      if (!parsed.success) return null;
      const user = await prisma.user.findUnique({
        where: { email: parsed.data.email.toLowerCase() },
      });
      if (!user?.passwordHash) return null;
      const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
      if (!ok) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
      };
    },
  }),
  // Google OAuth is enabled when client ID and secret are present.
  ...(googleClientId && googleClientSecret
    ? [
        Google({
          clientId: googleClientId,
          clientSecret: googleClientSecret,
        }),
      ]
    : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  // JWT sessions: the Credentials provider requires them (Auth.js v5), and
  // they keep OAuth sign-ins working alongside credentials.
  session: { strategy: "jwt" },
  jwt: {
    async decode(params) {
      try {
        return await defaultDecode(params);
      } catch {
        return null;
      }
    },
  },
  logger: {
    error(error) {
      if (
        (error as { name?: string; type?: string })?.name === "JWTSessionError" ||
        (error as { name?: string; type?: string })?.type === "JWTSessionError"
      ) {
        return;
      }
      console.error(error);
    },
  },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as { role?: Role }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
});
