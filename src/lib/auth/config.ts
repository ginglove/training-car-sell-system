import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { verifyMockOTP } from "@/lib/mock/otp";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "autodealer-secret-key-production-2026",
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        identity: { label: "Email / Phone", type: "text" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" },
        mode: { label: "Mode", type: "text" },
      },
      async authorize(credentials: any) {
        if (!credentials?.identity) return null;

        const identity = credentials.identity as string;
        const mode = credentials.mode as string;

        const [user] = await db
          .select()
          .from(users)
          .where(
            or(
              eq(users.email, identity),
              eq(users.phone, identity)
            )
          )
          .limit(1);

        if (!user || !user.isActive) return null;

        if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
          throw new Error("ERR_UI_004");
        }

        if (mode === "otp") {
          const otp = credentials.otp as string;
          if (!verifyMockOTP(otp)) {
            throw new Error("ERR_UI_005");
          }
        } else {
          const password = credentials.password as string;
          if (!password) return null;

          const isValid = await compare(password, user.passwordHash);
          if (!isValid) {
            await db
              .update(users)
              .set({
                failedLoginAttempts: (user.failedLoginAttempts || 0) + 1,
                lockedUntil:
                  (user.failedLoginAttempts || 0) + 1 >= 5
                    ? new Date(Date.now() + 30 * 60 * 1000)
                    : null,
              })
              .where(eq(users.id, user.id));

            throw new Error("ERR_UI_003");
          }
        }

        await db
          .update(users)
          .set({ failedLoginAttempts: 0, lockedUntil: null })
          .where(eq(users.id, user.id));

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          showroomId: user.showroomId,
          phone: user.phone,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = (user as any).role;
        token.showroomId = (user as any).showroomId;
        token.phone = (user as any).phone;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).showroomId = token.showroomId;
        (session.user as any).phone = token.phone;
      }
      return session;
    },
  },
  trustHost: true,
});
