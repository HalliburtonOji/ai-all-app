"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { SUPPORTED_CURRENCIES, type Currency } from "@/types/earnings";

const VALID_CURRENCIES: ReadonlySet<string> = new Set(SUPPORTED_CURRENCIES);

const MAX_SOURCE_LEN = 200;
const MAX_NOTE_LEN = 500;
// Cap at $1B equivalent — beyond this, you have bigger problems than
// our income tracker. Prevents accidental 10000000-cent fat-finger.
const MAX_AMOUNT_CENTS = 100_000_000_000;

export interface AddEarningResult {
  earningId?: string;
  error?: string;
}

export async function addEarning(
  formData: FormData,
): Promise<AddEarningResult> {
  const amountStr = ((formData.get("amount") as string) ?? "").trim();
  const currency = ((formData.get("currency") as string) ?? "").trim();
  const source = ((formData.get("source") as string) ?? "").trim();
  const occurredOn = ((formData.get("occurred_on") as string) ?? "").trim();
  const note = ((formData.get("note") as string) ?? "").trim();
  const projectId = ((formData.get("project_id") as string) ?? "").trim();
  const clientId = ((formData.get("client_id") as string) ?? "").trim();

  if (!amountStr) return { error: "Amount is required" };
  const amountMajor = Number.parseFloat(amountStr);
  if (!Number.isFinite(amountMajor) || amountMajor <= 0) {
    return { error: "Amount must be a positive number" };
  }
  const amountCents = Math.round(amountMajor * 100);
  if (amountCents > MAX_AMOUNT_CENTS) {
    return { error: "Amount is too large" };
  }

  if (!VALID_CURRENCIES.has(currency)) {
    return { error: "Pick a currency" };
  }
  if (!source) return { error: "Source is required" };
  if (source.length > MAX_SOURCE_LEN) {
    return { error: `Source must be ${MAX_SOURCE_LEN} characters or fewer` };
  }
  if (note.length > MAX_NOTE_LEN) {
    return { error: `Note must be ${MAX_NOTE_LEN} characters or fewer` };
  }
  if (!occurredOn || !/^\d{4}-\d{2}-\d{2}$/.test(occurredOn)) {
    return { error: "Pick a date" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // If project_id is supplied, ensure it belongs to this user. RLS would
  // block the cross-user case anyway because the FK target row wouldn't
  // be visible — but we want a clear error rather than a silent insert.
  let resolvedProjectId: string | null = null;
  if (projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .maybeSingle();
    if (!project || project.user_id !== user.id) {
      return { error: "That project isn't yours" };
    }
    resolvedProjectId = project.id;
  }

  let resolvedClientId: string | null = null;
  if (clientId) {
    const { data: client } = await supabase
      .from("clients")
      .select("id, user_id")
      .eq("id", clientId)
      .maybeSingle();
    if (!client || client.user_id !== user.id) {
      return { error: "That client isn't yours" };
    }
    resolvedClientId = client.id;
  }

  const { data, error } = await supabase
    .from("earnings")
    .insert({
      user_id: user.id,
      project_id: resolvedProjectId,
      client_id: resolvedClientId,
      amount_cents: amountCents,
      currency: currency as Currency,
      source,
      occurred_on: occurredOn,
      note: note || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Could not save earning" };
  }

  revalidatePath("/me/earnings");
  return { earningId: data.id };
}

export async function deleteEarning(formData: FormData) {
  const id = ((formData.get("id") as string) ?? "").trim();
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("earnings").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/me/earnings");
}
