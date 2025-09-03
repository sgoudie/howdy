import { SettingsForm } from "@/components/SettingsForm";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SettingsData = {
  email: string;
  firstName: string;
  lastName: string;
  accountName: string;
  convertkitApiKey: string;
  convertkitTag: string;
};

async function loadSettings(): Promise<SettingsData> {
  const supabase = await getSupabaseServer();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  const email = user?.email ?? "";
  const meta = (user?.user_metadata as Record<string, unknown> | undefined) || {};
  const firstName = typeof meta.first_name === "string" ? (meta.first_name as string) : "";
  const lastName = typeof meta.last_name === "string" ? (meta.last_name as string) : "";

  const { data: acc } = await supabase
    .from("accounts")
    .select("name,convertkit_api_key,convertkit_howdy_tag_label")
    .eq("user_id", user?.id || "")
    .limit(1)
    .maybeSingle();

  return {
    email,
    firstName,
    lastName,
    accountName: (acc?.name as string | null) || "",
    convertkitApiKey: (acc?.convertkit_api_key as string | null) || "",
    convertkitTag: (acc?.convertkit_howdy_tag_label as string | null) || "source-howdy",
  };
}

export default function SettingsIndex() {
  const dataPromise = loadSettings();

  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto w-full px-6 py-8">
        <div className="rounded-lg border bg-white p-6">
          <SettingsPageInner dataPromise={dataPromise} />
        </div>
      </div>
    </div>
  );
}

async function SettingsPageInner({ dataPromise }: { dataPromise: Promise<SettingsData> }) {
  const data = await dataPromise;
  return <SettingsForm initialData={data} />;
}


