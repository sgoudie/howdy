import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabaseServer";
import Sidebar from "@/components/Sidebar";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  return (
    <div className="min-h-screen w-full grid grid-cols-[260px_1fr]">
      <aside className="border-r bg-white">
        <Sidebar />
      </aside>
      <main className="min-w-0">{children}</main>
    </div>
  );
}


