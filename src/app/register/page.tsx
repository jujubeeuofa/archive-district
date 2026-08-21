"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { registerAction, type RegisterState } from "./actions";

const initialState: RegisterState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Creating account..." : "Create account"}
    </button>
  );
}

export default function RegisterPage() {
  const [state, formAction] = useFormState(registerAction, initialState);

  if (state.success) {
    return (
      <div className="mx-auto max-w-md">
        <div className="card p-6 text-center">
          <h1 className="text-xl font-semibold text-bone">Account created</h1>
          <p className="mt-2 text-sm text-ink-300">
            Your client account is ready. You can now log in.
          </p>
          <Link href="/login" className="btn-primary mt-4 inline-flex">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-display uppercase text-bone">Create your account</h1>
      <p className="mt-1 text-sm text-ink-300">
        Register as a client to buy, sell, and track your orders.
      </p>

      <form action={formAction} className="card mt-6 space-y-4 p-6">
        {state.error && (
          <p className="rounded-lg border border-red-800 bg-red-900/40 px-3 py-2 text-sm text-red-200">
            {state.error}
          </p>
        )}

        <div>
          <label className="label" htmlFor="name">
            Full name
          </label>
          <input className="input" id="name" name="name" type="text" required />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input className="input" id="email" name="email" type="email" required />
        </div>
        <div>
          <label className="label" htmlFor="phone">
            Phone (optional)
          </label>
          <input className="input" id="phone" name="phone" type="tel" />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            className="input"
            id="password"
            name="password"
            type="password"
            minLength={8}
            required
          />
        </div>

        <SubmitButton />

        <p className="text-center text-sm text-ink-400">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:text-accent-light">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
