import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

/**
 * CSV export of the current user's earnings. Owner-only via RLS —
 * the query just selects what auth.uid() can see, no extra filtering
 * required.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: rows } = await supabase
    .from("earnings")
    .select(
      "occurred_on, amount_cents, currency, source, note, project_id, created_at",
    )
    .order("occurred_on", { ascending: false });

  const header = "date,amount,currency,source,note,project_id,created_at";
  const body = (rows ?? [])
    .map((r) => {
      const major = (r.amount_cents as number) / 100;
      return [
        r.occurred_on,
        major.toFixed(2),
        r.currency,
        csvEscape(r.source as string),
        csvEscape((r.note as string | null) ?? ""),
        (r.project_id as string | null) ?? "",
        r.created_at,
      ].join(",");
    })
    .join("\n");

  const csv = `${header}\n${body}\n`;
  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="earnings-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}

function csvEscape(s: string): string {
  if (s === "") return "";
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
