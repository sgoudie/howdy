"use client";

import { useState } from "react";
import { usePathname } from 'next/navigation'
import { supabase } from "@/lib/supabaseClient";

type FormState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>({ status: "idle" });
  const pathname = usePathname()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) {
      setState({ status: "error", message: "Please enter your email." });
      return;
    }

    setState({ status: "loading" });
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${pathname}/auth/callback`,
        },
      });
      if (error) {
        setState({ status: "error", message: error.message || "Login failed." });
        return;
      }
      setState({ status: "success", message: "Check your email for the login link." });
    } catch {
      setState({ status: "error", message: "Unexpected error. Please try again." });
    }
  }

  const isLoading = state.status === "loading";

  return (
    <div className="w-full py-16 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto rounded-xl border border-gray-200 bg-white/50 dark:bg-black/20 shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-2">Login</h2>
        <p className="text-sm text-gray-600 mb-6">We will send you a magic link.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            inputMode="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-gray-300 bg-white/80 dark:bg-black/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed w-full"
          >
            {isLoading ? "Sending..." : "Send magic link"}
          </button>
        </form>
        {state.status === "success" && (
          <p className="mt-4 text-sm text-green-600">{state.message}</p>
        )}
        {state.status === "error" && (
          <p className="mt-4 text-sm text-red-600">{state.message}</p>
        )}
      </div>
    </div>
  );
}


