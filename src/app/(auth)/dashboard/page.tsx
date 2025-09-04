import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabaseServer";
import AddSubscriberForm from "@/features/subscribers/components/AddSubscriberForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = await getSupabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const hasFirstName = user && user.user_metadata && (user.user_metadata as any).first_name;
  if (!user) redirect("/login");
  const { data: acc } = await supabase
    .from("accounts")
    .select("convertkit_howdy_tag_label")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  return (
    <div className="w-full">
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="text-2xl font-semibold mt-8">Howdy {hasFirstName ? (user.user_metadata as any).first_name : "friend"} 👋</h1>
      </div>
      <div className="px-6 pb-8">
        <AddSubscriberForm initialTagLabel={(acc?.convertkit_howdy_tag_label as string | null) || undefined} />
      </div>
    </div>
  );
}


