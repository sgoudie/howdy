"use client";

import { useEffect, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
//

type FormState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export default function AddSubscriberForm({ initialTagLabel }: { initialTagLabel?: string }) {
  const { account } = useAccount();
  const tagToShow = account?.convertkit_howdy_tag_label || initialTagLabel || "source-howdy";
  const [state, setState] = useState<FormState>({ status: "idle" });
  const formSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email." }),
    phone: z.string().optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", phone: "" },
  });

  useEffect(() => {
    // no-op placeholder for future validations
  }, []);

  async function onSubmit(values: FormValues) {
    console.log("AddSubscriberForm: submit handler invoked");

    setState({ status: "loading" });
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      console.log("AddSubscriberForm: POST /api/subscribers", values);
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));
      console.log("AddSubscriberForm: response", res.status);
      const data: { ok?: boolean; error?: string } = await res
        .json()
        .catch(() => ({}) as { ok?: boolean; error?: string });

      if (!res.ok || data?.ok === false) {
        const status = res.status;
        const serverError = typeof data?.error === "string" ? data.error : undefined;

        let friendly = "Failed to subscribe.";
        if (status === 400) friendly = serverError || "Please enter a valid email address.";
        else if (status === 401 || status === 403)
          friendly = "Not authenticated. Please log in and try again.";
        else if (status === 404) friendly = "Tag not found or not accessible.";
        else if (status === 422)
          friendly = serverError || "Validation failed. Please check the email.";
        else if (status >= 500) friendly = serverError || "Server error. Please try again shortly.";

        // Log detailed diagnostics for developers
        console.error("/api/subscribers error", { status, response: data });

        setState({ status: "error", message: friendly });
        return;
      }
      form.reset({ email: "", phone: "" });
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

  const isLoading = state.status === "loading" || form.formState.isSubmitting;

  return (
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Quick add subscriber</CardTitle>
          <CardDescription>
            Enter an email and optionally a phone number. We&apos;ll add it to your Kit account (tagged as <code>{tagToShow}</code>)
          </CardDescription>
        </CardHeader>
        <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (optional)</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="phone number (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Subscribing..." : "Add Subscriber"}
            </Button>
          </form>
        </Form>
        {state.status === "success" && (
          <p className="mt-4 text-sm text-green-600">{state.message}</p>
        )}
        {state.status === "error" && <p className="mt-4 text-sm text-red-600">{state.message}</p>}
        </CardContent>
      </Card>
  );
}
