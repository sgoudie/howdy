"use client";

import { useEffect, useState } from "react";

type FormState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export default function AddSubscriberForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [tagName, setTagName] = useState<string>("source-howdy");
  const [tagError, setTagError] = useState<string | null>(null);
  const [isLoadingTag, setIsLoadingTag] = useState<boolean>(false);

  useEffect(() => {
    setTagError(null);
  }, [tagName]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) {
      setState({ status: "error", message: "Please enter your email." });
      return;
    }

    setState({ status: "loading" });
    try {
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tag: tagName }),
      });
      const data = await res.json().catch(() => ({} as unknown));

      if (!res.ok || (data as any)?.ok === false) {
        const status = res.status;
        const serverError = typeof (data as any)?.error === "string" ? (data as any).error : undefined;

        let friendly = "Failed to subscribe.";
        if (status === 400) friendly = serverError || "Please enter a valid email address.";
        else if (status === 401 || status === 403) friendly = "Authentication failed. Check CONVERTKIT_API_KEY.";
        else if (status === 404) friendly = "Tag not found. Check CONVERTKIT_TAG_ID is a numeric tag ID.";
        else if (status === 422) friendly = serverError || "Validation failed. Please check the email.";
        else if (status >= 500) friendly = serverError || "Server error. Please try again shortly.";

        // Log detailed diagnostics for developers
        // eslint-disable-next-line no-console
        console.error("/api/subscribers error", { status, response: data });

        setState({ status: "error", message: friendly });
        return;
      }
      setEmail("");
      setState({ status: "success", message: "Subscriber added successfully." });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Network error calling /api/subscribers", error);
      setState({ status: "error", message: "Network error. Please try again." });
    }
  }

  const isLoading = state.status === "loading";

  return (
    <div className="w-full py-16 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto rounded-xl border border-gray-200 bg-white/50 dark:bg-black/20 shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-2">Add a subscriber</h2>
        <p className="text-sm text-gray-600 mb-6">
          Enter an email. We'll add it to your Kit account and tag it with {tagName ? <span className="font-medium">{tagName}</span> : "your tag"}.
        </p>
        {tagError && (
          <p className="-mt-4 mb-4 text-sm text-amber-600">{tagError}</p>
        )}
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
            type="text"
            name="tag"
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            placeholder="tag name (e.g., source-howdy)"
            className="w-full rounded-lg border border-gray-300 bg-white/80 dark:bg-black/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading}
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


