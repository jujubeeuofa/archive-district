"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }

    const callbackUrl = searchParams.get("callbackUrl") || "/account";
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-display uppercase text-bone">Log in</h1>
      <p className="mt-1 text-sm text-ink-300">
        Demo credentials: <code className="text-accent">admin@example.com</code> /{" "}
        <code className="text-accent">password123</code> (admin) or{" "}
        <code className="text-accent">client1@example.com</code> /{" "}
        <code className="text-accent">password123</code> (client).
      </p>

      <form onSubmit={handleSubmit} className="card mt-6 space-y-4 p-6">
        {error && (
          <p className="rounded-lg border border-red-800 bg-red-900/40 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}

        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            className="input"
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            className="input"
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Signing in..." : "Log in"}
        </button>

        <p className="text-center text-sm text-ink-400">
          Need an account?{" "}
          <Link href="/register" className="text-accent hover:text-accent-light">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
