"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type FormState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export default function AccountSettingsForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState<string>("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [state, setState] = useState<FormState>({ status: "idle" });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!mounted) return;
      if (user) {
        setEmail(user.email ?? "");
        const meta = user.user_metadata as Record<string, unknown> | undefined;
        setFirstName(typeof meta?.first_name === "string" ? meta!.first_name : "");
        setLastName(typeof meta?.last_name === "string" ? meta!.last_name : "");
      }
      setLoadingProfile(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ status: "loading" });
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      });
      if (error) {
        setState({ status: "error", message: error.message || "Failed to update settings." });
        return;
      }
      setState({ status: "success", message: "Settings updated." });
    } catch (_err) {
      setState({ status: "error", message: "Unexpected error. Please try again." });
    }
  }

  const isSaving = state.status === "loading";

  return (
    <div className="w-full py-16 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto rounded-xl border border-gray-200 bg-white/50 dark:bg-black/20 shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-2">Account Settings</h2>
        <p className="text-sm text-gray-600 mb-6">Update your profile details.</p>

        {loadingProfile ? (
          <p className="text-sm text-gray-600">Loading...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">First name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full rounded-lg border border-gray-300 bg-white/80 dark:bg-black/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full rounded-lg border border-gray-300 bg-white/80 dark:bg-black/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed w-full"
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </form>
        )}

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


