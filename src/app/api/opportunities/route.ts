import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { searchOpportunities } from "@/lib/opportunities/sources";

export const dynamic = "force-dynamic";

const MAX_KEYWORD_LENGTH = 100;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const keyword = (url.searchParams.get("q") ?? "").trim();

  if (keyword.length > MAX_KEYWORD_LENGTH) {
    return NextResponse.json(
      { error: `Keyword must be ${MAX_KEYWORD_LENGTH} chars or fewer` },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const opportunities = await searchOpportunities(keyword);
  return NextResponse.json({ opportunities });
}
