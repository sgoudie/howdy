"use client";

import { useState } from "react";
import { Message } from "@/components/Message";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { checkConvertKitConnection, type ConnectionStatus } from "@/app/(auth)/dashboard/actions";
import { cn } from "@/lib/utils";
import { RefreshCcw, Circle } from "lucide-react";

type Props = {
  initialStatus: ConnectionStatus;
};

function Dot({ color }: { color: "red" | "green" | "orange" | "gray" }) {
  const colorClass =
    color === "red"
      ? "text-red-500"
      : color === "green"
        ? "text-green-500"
        : color === "orange"
          ? "text-orange-500"
          : "text-zinc-400";
  return (
    <Circle
      aria-hidden
      className={cn("h-2.5 w-2.5", colorClass)}
      fill="currentColor"
      stroke="none"
    />
  );
}

export default function ConnectionStatusCard({ initialStatus }: Props) {
  const [status, setStatus] = useState<ConnectionStatus>(initialStatus);
  const [isChecking, setIsChecking] = useState(false);

  async function refresh() {
    setIsChecking(true);
    try {
      const next = await checkConvertKitConnection();
      setStatus(next);
    } finally {
      setIsChecking(false);
    }
  }

  const lastChecked = new Date(status.checkedAt);
  function formatUtc(date: Date): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    const hh = String(date.getUTCHours()).padStart(2, "0");
    const mm = String(date.getUTCMinutes()).padStart(2, "0");
    const ss = String(date.getUTCSeconds()).padStart(2, "0");
    return `${y}-${m}-${d} ${hh}:${mm}:${ss} UTC`;
  }

  const renderStatus = () => {
    if (status.status === "missing") {
      return (
        <Message>
          <div className="flex items-center gap-2">
            <Dot color="red" />
            <p>
              ConvertKit API key not set. Add one in
              {" "}
              <Link href="/settings" className="underline underline-offset-4">
                Settings
              </Link>
              .
            </p>
          </div>
        </Message>
      );
    }
    if (status.status === "error") {
      return (
        <Message>
          <div className="flex items-center gap-2">
            <Dot color="orange" />
            <p>
              ConvertKit connection issue: {status.error} –
              {" "}
              <Link href="/settings" className="underline underline-offset-4">Update settings</Link>
            </p>
          </div>
        </Message>
      );
    }
    return (
      <Message>
        <div className="flex items-center gap-2">
          <Dot color="green" />
          <p>ConvertKit is connected.</p>
        </div>
      </Message>
    );
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center">
        <CardTitle>Connections</CardTitle>
        <CardAction>
          <Button
            size="icon"
            variant="outline"
            aria-label="Check again"
            title="Check again"
            onClick={refresh}
            disabled={isChecking}
          >
            <RefreshCcw className={cn("h-4 w-4", isChecking && "animate-spin")} />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {renderStatus()}
        <div className="text-xs text-muted-foreground">
          Last checked: <time suppressHydrationWarning dateTime={status.checkedAt}>{formatUtc(lastChecked)}</time>
        </div>
        <Message className="opacity-60" aria-disabled>
          <div className="flex items-center gap-2">
            <Dot color="gray" />
            <p>Mailchimp (coming soon)</p>
          </div>
        </Message>
      </CardContent>
    </Card>
  );
}


