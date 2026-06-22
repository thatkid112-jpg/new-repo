"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Shared sign-in / sign-up form (email + password) with an optional Google button.
export function AuthForm({
  mode,
  callbackUrl,
  googleEnabled,
}: {
  mode: "signin" | "signup";
  callbackUrl: string;
  googleEnabled: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isSignup) {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Sign-up failed.");
        }
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        throw new Error(
          isSignup ? "Account created, but sign-in failed." : "Invalid email or password."
        );
      }
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent";

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
        {isSignup ? "Create your account" : "Sign in"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {isSignup
          ? "Get access to the full historical trend archive."
          : "Welcome back. Sign in to view the archive."}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        {isSignup && (
          <input
            type="text"
            placeholder="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
            autoComplete="name"
          />
        )}
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
          autoComplete="email"
        />
        <input
          type="password"
          required
          minLength={isSignup ? 8 : undefined}
          placeholder={isSignup ? "Password (min 8 characters)" : "Password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
          autoComplete={isSignup ? "new-password" : "current-password"}
        />

        {error && <p className="text-sm text-accent">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-accent px-4 py-2 font-display text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
        </button>
      </form>

      {googleEnabled && (
        <button
          onClick={() => signIn("google", { callbackUrl })}
          className="mt-3 w-full rounded-md border border-border bg-card px-4 py-2 font-display text-sm font-medium text-ink transition-colors hover:border-accent"
        >
          Continue with Google
        </button>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link
              href={`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="font-medium text-accent hover:underline"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link
              href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="font-medium text-accent hover:underline"
            >
              Create an account
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
