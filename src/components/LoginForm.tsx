"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getPublicEnv } from "@/lib/env";
import { Hand } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>({ status: "idle" });
  const { APP_URL } = getPublicEnv();

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
          emailRedirectTo: `${APP_URL}/auth/callback`,
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
    <div className={cn("flex flex-col gap-6")}> 
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <a href="#" className="flex flex-col items-center gap-2 font-medium">
              <div className="flex size-8 items-center justify-center rounded-md">
                <Hand className="size-6" />
              </div>
              <span className="sr-only">Howdy</span>
            </a>
            <h1 className="text-xl font-bold">Welcome to Howdy</h1>
            <div className="text-center text-sm text-muted-foreground">We’ll send you a magic link.</div>
          </div>
          <div className="flex flex-col gap-6">
            <div className="grid gap-3">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input id="email" type="email" inputMode="email" autoComplete="email" required placeholder="e.g del.preston@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send magic link"}
            </Button>
          </div>
        </div>
      </form>
      {state.status === "success" && (
        <div className="text-muted-foreground text-center text-xs">{state.message}</div>
      )}
      {state.status === "error" && (
        <div className="text-center text-xs text-red-600">{state.message}</div>
      )}
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
