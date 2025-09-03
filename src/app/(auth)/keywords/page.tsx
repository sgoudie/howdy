import { getSupabaseServer } from "@/lib/supabaseServer";
import { AddKeywordForm } from "./ui/AddKeywordForm";
import { KeywordsTable } from "./ui/KeywordsTable";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function loadKeywords() {
  const supabase = await getSupabaseServer();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) return [] as { id: string; label: string; created_at: string }[];

  const { data: account } = await supabase
    .from("accounts")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!account) return [] as { id: string; label: string; created_at: string }[];

  const { data } = await supabase
    .from("keywords")
    .select("id,label,created_at")
    .eq("account_id", account.id)
    .order("created_at", { ascending: false });

  return (data || []) as { id: string; label: string; created_at: string }[];
}

export default async function KeywordsIndexPage() {
  const keywords = await loadKeywords();
  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto w-full px-6 py-8">
        <div className="rounded-lg border bg-white p-6">
          <h1 className="text-xl font-semibold mb-4">Keywords</h1>
          <AddKeywordForm />
          <div className="mt-6">
            <KeywordsTable rows={keywords} />
          </div>
        </div>
      </div>
    </div>
  );
}


