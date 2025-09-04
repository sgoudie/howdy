"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type SidebarContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function SidebarProvider({
  children,
  open: controlledOpen,
  onOpenChange,
  defaultOpen = true,
  ...rest
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} & React.HTMLAttributes<HTMLDivElement>) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState<boolean>(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (isControlled) {
        onOpenChange?.(next);
      } else {
        setUncontrolledOpen(next);
      }
    },
    [isControlled, onOpenChange],
  );

  const value = React.useMemo(() => ({ open, setOpen }), [open, setOpen]);
  return (
    <SidebarContext.Provider value={value}>
      <div className={cn("flex w-full min-h-screen", rest.className)} {...rest}>
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within a SidebarProvider.");
  return ctx;
}

export function Sidebar({
  className,
  children,
  variant,
}: {
  className?: string;
  children: React.ReactNode;
  variant?: "inset" | "floating";
}) {
  const base = "shrink-0 bg-[var(--sidebar)] text-[var(--sidebar-foreground)]";
  const width = "[width:var(--sidebar-width,260px)]";
  const position = variant === "inset"
    ? "sticky [top:var(--header-height,0px)] [height:calc(100dvh-var(--header-height,0px))]"
    : "h-screen sticky top-0";
  return (
    <aside className={cn(base, width, position, className)} data-variant={variant || "default"}>
      <div className="flex h-full flex-col">{children}</div>
    </aside>
  );
}

export function SidebarHeader({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return <div className={cn("px-3 py-3", className)}>{children}</div>;
}

export function SidebarFooter({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return <div className={cn("mt-auto px-3 py-3", className)}>{children}</div>;
}

export function SidebarContent({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return <div className={cn("overflow-auto px-2 py-2", className)}>{children}</div>;
}

export function SidebarGroup({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return <div className={cn("mb-3", className)}>{children}</div>;
}

export function SidebarGroupLabel({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn("px-3 py-2 text-xs font-medium text-[var(--sidebar-foreground)]/60", className)}
    >
      {children}
    </div>
  );
}

export function SidebarGroupContent({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return <div className={cn("px-1", className)}>{children}</div>;
}

export function SidebarMenu({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return <ul className={cn("flex flex-col gap-1", className)}>{children}</ul>;
}

export function SidebarMenuItem({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return <li className={cn("list-none", className)}>{children}</li>;
}

export function SidebarMenuButton({
  className,
  asChild,
  isActive,
  children,
}: {
  className?: string;
  asChild?: boolean;
  isActive?: boolean;
  children?: React.ReactNode;
}) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="sidebar-menu-button"
      data-active={isActive ? "true" : undefined}
      className={cn(
        "group flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm",
        "text-[var(--sidebar-foreground)]/85 hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]",
        "data-[active=true]:bg-[var(--sidebar-accent)] data-[active=true]:text-[var(--sidebar-accent-foreground)]",
        className,
      )}
    >
      {children}
    </Comp>
  );
}

export function SidebarTrigger({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const { open, setOpen } = useSidebar();
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={cn(
        "inline-flex items-center justify-center rounded-md border px-2 py-1 text-sm",
        "bg-background text-foreground",
        className,
      )}
      aria-label="Toggle sidebar"
    >
      {children ?? <span>Toggle</span>}
    </button>
  );
}

export function SidebarInset({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-1 min-w-0", className)} {...props}>
      {children}
    </div>
  );
}
