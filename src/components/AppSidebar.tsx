"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Settings, Tags, LogOut, LifeBuoy, Send } from "lucide-react";
import { appLinks } from "@/lib/config";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", href: "/dashboard", icon: Home },
  { title: "Keywords", href: "/keywords", icon: Tags },
  { title: "Settings", href: "/settings", icon: Settings },
];

export function AppSidebar({ variant }: { variant?: "inset" | "floating" }) {
  const pathname = usePathname();
  return (
    <Sidebar variant={variant}>
      <SidebarHeader>
        <SidebarMenuItem>
          <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
            <a href="/dashboard">
              <span className="text-base font-semibold">Howdy</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active =
                  pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link href={item.href} className="flex items-center gap-2">
                        <Icon size={16} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href={appLinks.support} className="flex items-center gap-2">
                <LifeBuoy size={16} />
                <span>Support</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href={appLinks.feedback} className="flex items-center gap-2">
                <Send size={16} />
                <span>Feedback</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action="/api/logout" method="post">
              <SidebarMenuButton asChild>
                <button type="submit" className="flex items-center gap-2">
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="mt-2 text-xs opacity-60">Howdy v0.1.0</div>
      </SidebarFooter>
    </Sidebar>
  );
}
