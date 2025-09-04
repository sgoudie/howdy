"use client";

import { useEffect, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
//

type FormState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export default function AddSubscriberForm({ initialTagLabel }: { initialTagLabel?: string }) {
  const { account } = useAccount();
  const tagToShow = account?.convertkit_howdy_tag_label || initialTagLabel || "source-howdy";
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [phone, setPhone] = useState<string>("");

  useEffect(() => {
    // no-op placeholder for future validations
  }, [phone]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log("AddSubscriberForm: submit handler invoked");
    if (!email.trim()) {
      setState({ status: "error", message: "Please enter your email." });
      return;
    }

    setState({ status: "loading" });
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      console.log("AddSubscriberForm: POST /api/subscribers", { email, phone });
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));
      console.log("AddSubscriberForm: response", res.status);
      const data: { ok?: boolean; error?: string } = await res.json().catch(() => ({}) as { ok?: boolean; error?: string });

      if (!res.ok || data?.ok === false) {
        const status = res.status;
        const serverError = typeof data?.error === "string" ? data.error : undefined;

        let friendly = "Failed to subscribe.";
        if (status === 400) friendly = serverError || "Please enter a valid email address.";
        else if (status === 401 || status === 403) friendly = "Not authenticated. Please log in and try again.";
        else if (status === 404) friendly = "Tag not found or not accessible.";
        else if (status === 422) friendly = serverError || "Validation failed. Please check the email.";
        else if (status >= 500) friendly = serverError || "Server error. Please try again shortly.";

        // Log detailed diagnostics for developers
        console.error("/api/subscribers error", { status, response: data });

        setState({ status: "error", message: friendly });
        return;
      }
      setEmail("");
      setPhone("");
      setState({ status: "success", message: "Subscriber added successfully." });
    } catch (error) {
      const aborted = (error as { name?: string } | null)?.name === "AbortError";
      if (aborted) {
        console.error("/api/subscribers aborted after timeout");
        setState({ status: "error", message: "Request timed out. Please try again." });
      } else {
        console.error("Network error calling /api/subscribers", error);
        setState({ status: "error", message: "Network error. Please try again." });
      }
    }
  }

  const isLoading = state.status === "loading";

  return (
    <div className="w-full py-16 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto rounded-xl border border-gray-200 bg-white/50 dark:bg-black/20 shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-2">Quick add subscriber</h2>
        <p className="text-sm text-gray-600 mb-6">
          Enter an email and optionally a phone number. We&apos;ll add it to your Kit account (tagged as <code className="px-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">{tagToShow}</code>)
        </p>
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
          <input
            type="tel"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="phone number (optional)"
            className="w-full rounded-lg border border-gray-300 bg-white/80 dark:bg-black/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            onClick={() => console.log("AddSubscriberForm: submit button clicked")}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed w-full"
          >
            {isLoading ? "Subscribing..." : "Add Subscriber"}
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


