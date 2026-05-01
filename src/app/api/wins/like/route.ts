import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Toggle a like for the current user on a Studio output. Body:
 *   { outputId: string }
 *
 * Returns: { liked: boolean, likeCount: number }
 *
 * Auth required. RLS handles the rest — only the current user can
 * insert a row with their own user_id, and only delete their own.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { outputId } = (body ?? {}) as { outputId?: unknown };
  if (typeof outputId !== "string" || !outputId) {
    return Response.json(
      { error: "outputId is required" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Only allow liking outputs that are actually public — RLS lets
  // anyone SELECT public outputs, so this query is safe.
  const { data: output } = await supabase
    .from("studio_outputs")
    .select("id, is_public")
    .eq("id", outputId)
    .maybeSingle();
  if (!output || !output.is_public) {
    return Response.json(
      { error: "Output not found or not public" },
      { status: 404 },
    );
  }

  // Toggle: if a like row exists, delete it; otherwise insert.
  const { data: existing } = await supabase
    .from("output_likes")
    .select("id")
    .eq("output_id", outputId)
    .eq("user_id", user.id)
    .maybeSingle();

  let liked: boolean;
  if (existing) {
    await supabase
      .from("output_likes")
      .delete()
      .eq("id", existing.id)
      .eq("user_id", user.id);
    liked = false;
  } else {
    await supabase.from("output_likes").insert({
      output_id: outputId,
      user_id: user.id,
    });
    liked = true;
  }

  const { count } = await supabase
    .from("output_likes")
    .select("id", { count: "exact", head: true })
    .eq("output_id", outputId);

  return Response.json({ liked, likeCount: count ?? 0 });
}
