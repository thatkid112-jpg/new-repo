import type { NextAuthConfig } from "next-auth";

// Edge-safe Auth.js config shared by middleware and the full server instance.
// IMPORTANT: keep this free of Node-only deps (Prisma, bcrypt) — middleware runs
// on the edge runtime. The full provider list + adapter live in `auth.ts`.
export const authConfig = {
  pages: { signIn: "/signin" },
  providers: [], // real providers are added in auth.ts (Node runtime)
  callbacks: {
    // Used by middleware for matched routes: require a signed-in user.
    authorized({ auth }) {
      return !!auth?.user;
    },
    // Surface the user id on the session (DB-free; read from the JWT).
    session({ session, token }) {
      if (token?.sub && session.user) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;
