"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { LoaderCircle, LogIn, UserPlus } from "lucide-react";

import { authClient } from "@/lib/auth-client";

type AuthGateProps = {
  children: ReactNode;
  enabled: boolean;
  signupEnabled: boolean;
};

export function AuthGate({ children, enabled, signupEnabled }: AuthGateProps) {
  if (!enabled) return children;

  return <EnabledAuthGate signupEnabled={signupEnabled}>{children}</EnabledAuthGate>;
}

function EnabledAuthGate({ children, signupEnabled }: Pick<AuthGateProps, "children" | "signupEnabled">) {
  const { data: session, isPending } = authClient.useSession();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isPending) {
    return (
      <main className="auth-page" aria-label="Loading session">
        <LoaderCircle className="auth-spinner" aria-hidden="true" />
      </main>
    );
  }

  if (session) return children;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "").trim();

    const result =
      mode === "sign-up" && signupEnabled
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password });

    if (result.error) {
      setError(result.error.message ?? "Authentication failed.");
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-brand">Povlex</div>
        <h1 id="auth-title">
          {mode === "sign-in" ? "Sign in to your workspace" : "Create your workspace"}
        </h1>
        <p>Your audits, findings, and client reports stay with your account.</p>

        <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "sign-in"}
            onClick={() => {
              setMode("sign-in");
              setError("");
            }}
          >
            <LogIn size={16} aria-hidden="true" /> Sign in
          </button>
          {signupEnabled ? (
            <button
              type="button"
              role="tab"
              aria-selected={mode === "sign-up"}
              onClick={() => {
                setMode("sign-up");
                setError("");
              }}
            >
              <UserPlus size={16} aria-hidden="true" /> Create account
            </button>
          ) : null}
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === "sign-up" ? (
            <label>
              Name
              <input name="name" autoComplete="name" required minLength={2} />
            </label>
          ) : null}
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
              required
              minLength={10}
            />
          </label>
          {error ? <div className="auth-error" role="alert">{error}</div> : null}
          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? <LoaderCircle className="auth-spinner" size={18} /> : null}
            {mode === "sign-in" ? "Sign in" : "Create account"}
          </button>
        </form>
      </section>
    </main>
  );
}
