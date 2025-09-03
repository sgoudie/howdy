"use client";

import { useActionState, useEffect, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { saveSettingsAction, type SaveSettingsResult } from "@/app/(auth)/settings/actions";

export function SettingsForm({ initialData }: {
  initialData: {
    email: string;
    firstName: string;
    lastName: string;
    accountName: string;
    convertkitApiKey: string;
    convertkitTag: string;
  };
}) {
  const { refresh: refreshAccount } = useAccount();

  const [email] = useState<string>(initialData.email);
  const [firstName, setFirstName] = useState<string>(initialData.firstName);
  const [lastName, setLastName] = useState<string>(initialData.lastName);
  const [accountName, setAccountName] = useState<string>(initialData.accountName);
  const [convertkitApiKey, setConvertkitApiKey] = useState<string>(initialData.convertkitApiKey);
  const [convertkitTag, setConvertkitTag] = useState<string>(initialData.convertkitTag || "source-howdy");

  const [state, formAction, isPending] = useActionState<SaveSettingsResult, FormData>(saveSettingsAction, { ok: false, message: "" });

  useEffect(() => {
    if (state?.ok) {
      refreshAccount().catch(() => {});
    }
  }, [state, refreshAccount]);

  const saving = isPending;

  return (
    <div className="max-w-3xl mx-auto w-full">
      <h1 className="text-xl font-semibold mb-2">Settings</h1>
      <p className="text-sm text-gray-600 mb-6">Manage your profile and account settings.</p>

      <form action={formAction} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
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
              name="firstName"
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white/80 dark:bg-black/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last name</label>
            <input
              type="text"
              value={lastName}
              name="lastName"
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white/80 dark:bg-black/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Account name</label>
            <input
              type="text"
              value={accountName}
              name="accountName"
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white/80 dark:bg-black/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ConvertKit API key</label>
            <input
              type="password"
              value={convertkitApiKey}
              name="convertkitApiKey"
              onChange={(e) => setConvertkitApiKey(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white/80 dark:bg-black/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ConvertKit tag</label>
            <input
              type="text"
              value={convertkitTag}
              name="convertkitTag"
              onChange={(e) => setConvertkitTag(e.target.value)}
              placeholder="source-howdy"
              className="w-full rounded-lg border border-gray-300 bg-white/80 dark:bg-black/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>

        {state?.ok && <p className="text-sm text-green-600">{state.message}</p>}
        {state && !state.ok && <p className="text-sm text-red-600">{state.message}</p>}
      </form>
    </div>
  );
}
