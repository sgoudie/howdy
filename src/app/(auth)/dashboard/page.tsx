import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabaseServer";
import AddSubscriberForm from "@/features/subscribers/components/AddSubscriberForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = await getSupabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const hasFirstName = user && typeof meta.first_name === "string" && meta.first_name;
  if (!user) redirect("/login");
  const { data: acc } = await supabase
    .from("accounts")
    .select("convertkit_howdy_tag_label")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  return (
    <div className="w-full">
      <div className="mx-auto max-w-2xl px-6">
        <h1 className="mt-8 text-2xl font-semibold">
          Howdy {hasFirstName ? String(meta.first_name) : "friend"} 👋
        </h1>
      </div>
      <div className="px-6 pb-8">
        <AddSubscriberForm
          initialTagLabel={(acc?.convertkit_howdy_tag_label as string | null) || undefined}
        />
      </div>
    </div>
  );
}
