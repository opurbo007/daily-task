import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const hasGoogle = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Only attach the DB adapter when Google OAuth is enabled.
  // PrismaAdapter conflicts with CredentialsProvider + JWT strategy in NextAuth v5
  // because it tries to write a DB session record even in JWT mode.
  ...(hasGoogle ? { adapter: PrismaAdapter(prisma) } : {}),

  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          console.log("[auth] validation failed:", parsed.error.flatten());
          return null;
        }

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          console.log("[auth] user not found:", email);
          return null;
        }
        if (!user.password) {
          console.log("[auth] user has no password (OAuth-only account?):", email);
          return null;
        }

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
          console.log("[auth] wrong password for:", email);
          return null;
        }

        console.log("[auth] login success:", email);
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),

    ...(hasGoogle
      ? [GoogleProvider({
          clientId:     process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        })]
      : []),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id      = user.id;
        token.email   = user.email;
        token.name    = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id)      session.user.id    = token.id      as string;
      if (token.email)   session.user.email = token.email   as string;
      if (token.name)    session.user.name  = token.name    as string;
      if (token.picture) session.user.image = token.picture as string;
      return session;
    },
  },
});