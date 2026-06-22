import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Sign up", robots: { index: false } };

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  const callbackUrl = searchParams.callbackUrl || "/archive";
  const session = await auth();
  if (session?.user) redirect(callbackUrl);

  const googleEnabled =
    !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

  return (
    <div className="py-8">
      <AuthForm mode="signup" callbackUrl={callbackUrl} googleEnabled={googleEnabled} />
    </div>
  );
}
