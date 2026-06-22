import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Edge middleware uses the lightweight (adapter-free) config. It only enforces
// "must be signed in" for /archive routes via the `authorized` callback, which
// redirects anonymous users to /signin. The subscription check happens in the
// archive page server components (Node runtime, DB access).
export const { auth: middleware } = NextAuth(authConfig);

export default middleware;

export const config = {
  matcher: ["/archive/:path*"],
};
