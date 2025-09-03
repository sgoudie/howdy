import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabaseServer";
import AddSubscriberForm from "@/features/subscribers/components/AddSubscriberForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = getSupabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const hasFirstName = user && user.user_metadata && user.user_metadata.first_name;
  if (!user) redirect("/login");

  return (
    <div className="w-full">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-semibold mt-8">Welcome {hasFirstName ? user.user_metadata.first_name : ""}</h1>
      </div>
      <AddSubscriberForm />
    </div>
  );
}


