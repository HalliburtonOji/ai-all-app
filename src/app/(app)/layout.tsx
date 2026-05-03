import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { NavBar } from "@/components/NavBar";
import { SearchPalette } from "@/components/SearchPalette";
import { getTranslator } from "@/lib/i18n/get-locale";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { locale, t } = await getTranslator();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <NavBar
        email={user.email!}
        locale={locale}
        labels={{
          dashboard: t("nav.dashboard"),
          projects: t("nav.projects"),
          learn: t("nav.learn"),
          work: t("nav.work"),
          wins: t("nav.wins"),
          earnings: t("nav.earnings"),
          clients: t("nav.clients"),
          opportunities: t("nav.opportunities"),
          failures: t("nav.failures"),
          keys: t("nav.keys"),
          logout: t("nav.logout"),
        }}
      />
      <SearchPalette />
      <div className="flex-1">{children}</div>
    </div>
  );
}
