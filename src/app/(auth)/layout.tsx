import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <main className="min-w-0">{children}</main>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
