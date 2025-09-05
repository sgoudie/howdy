"use client";

import { cn } from "@/lib/utils";

type MessageProps = {
  className?: string;
  children: React.ReactNode;
};

export function Message({ className, children }: MessageProps) {
  return (
    <div className={cn("rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground", className)}>
      <div className="flex items-start gap-2">
        {children}
      </div>
    </div>
  );
}


