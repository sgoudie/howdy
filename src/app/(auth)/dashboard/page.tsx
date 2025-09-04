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
      <div className="px-6 py-8">
        <div className="mx-auto w-full max-w-5xl">
          <h1 className="text-3xl font-semibold tracking-tight">
            Howdy {hasFirstName ? String(meta.first_name) : "friend"} 👋
          </h1>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground max-w-3xl">
            <p>
              Howdy helps you capture leads via SMS keywords and seamlessly sync them to your
              email list. Create keywords, connect your ConvertKit account, and start growing.
            </p>
            <p>
              You can add subscribers manually, or share your keyword to let people subscribe by
              texting it. Everything ends up tagged in ConvertKit so your automation stays tidy.
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 pb-8">
        <div className="mx-auto grid w-full max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AddSubscriberForm
            initialTagLabel={(acc?.convertkit_howdy_tag_label as string | null) || undefined}
          />
          {/* Future cards: quick stats, recent subscribers, docs links, etc. */}
        </div>
      </div>
    </div>
  );
}
