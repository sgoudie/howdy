"use client";

import { useActionState, useEffect, useState, startTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAccount } from "@/components/AccountProvider";
import { saveSettingsAction, type SaveSettingsResult } from "@/app/(auth)/settings/actions";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SettingsForm({
  initialData,
}: {
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
  const [showApiKey, setShowApiKey] = useState<boolean>(false);

  const [state, formAction, isPending] = useActionState<SaveSettingsResult, FormData>(
    saveSettingsAction,
    { ok: false, message: "" },
  );

  const formSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    accountName: z.string().optional(),
    convertkitApiKey: z.string().optional(),
    convertkitTag: z.string(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: initialData.firstName || "",
      lastName: initialData.lastName || "",
      accountName: initialData.accountName || "",
      convertkitApiKey: initialData.convertkitApiKey || "",
      convertkitTag: initialData.convertkitTag || "source-howdy",
    },
  });

  useEffect(() => {
    if (state?.ok) {
      refreshAccount().catch(() => {});
    }
  }, [state, refreshAccount]);

  const saving = isPending || form.formState.isSubmitting;

  async function onSubmit(values: FormValues) {
    const fd = new FormData();
    fd.append("firstName", values.firstName ?? "");
    fd.append("lastName", values.lastName ?? "");
    fd.append("accountName", values.accountName ?? "");
    fd.append("convertkitApiKey", values.convertkitApiKey ?? "");
    fd.append("convertkitTag", values.convertkitTag ?? "source-howdy");
    startTransition(() => {
      formAction(fd);
    });
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="mb-2 text-xl font-semibold">Settings</h1>
      <p className="mb-6 text-sm text-gray-600">Manage your profile and account settings.</p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" value={email} disabled />
                </FormControl>
              </FormItem>
            </div>
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="First name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last name</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Last name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="accountName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account name</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Your company or project" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="convertkitApiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ConvertKit API key</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input type={showApiKey ? "text" : "password"} {...field} />
                    </FormControl>
                    <button
                      type="button"
                      onClick={() => setShowApiKey((v) => !v)}
                      className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md border border-gray-300 bg-white/70 px-2 py-1 text-xs hover:bg-white/90 dark:bg-black/30 dark:hover:bg-black/40"
                      aria-label={showApiKey ? "Hide API key" : "Show API key"}
                    >
                      {showApiKey ? "Hide" : "Show"}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="convertkitTag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ConvertKit tag</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="source-howdy" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>

          {state?.ok && <p className="text-sm text-green-600">{state.message}</p>}
          {state && !state.ok && <p className="text-sm text-red-600">{state.message}</p>}
        </form>
      </Form>
    </div>
  );
}
