import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.isActive) {
          throw new Error("No account found with this email");
        }
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) throw new Error("Incorrect password");

        return {
          id:    user.id,
          email: user.email,
          name:  user.name,
          role:  user.role,
          avatar: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id     = user.id;
        token.role   = (user as any).role;
        token.avatar = (user as any).avatar;
        token.name   = user.name;
      }
      // Handle update() calls from the client (e.g. profile save)
      if (trigger === "update" && session) {
        if (session.name  !== undefined) token.name   = session.name;
        if (session.avatar !== undefined) token.avatar = session.avatar;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id     = token.id;
        (session.user as any).role   = token.role;
        (session.user as any).avatar = token.avatar;
        if (token.name) session.user.name = token.name as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
