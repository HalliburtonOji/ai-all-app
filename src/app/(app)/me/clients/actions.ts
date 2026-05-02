"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@/utils/supabase/server";
import {
  CLIENT_STATUSES,
  type ClientStatus,
} from "@/types/clients";

const ALLOWED_STATUSES: ReadonlySet<string> = new Set(CLIENT_STATUSES);

const MAX_NAME = 200;
const MAX_EMAIL = 200;
const MAX_COMPANY = 200;
const MAX_NOTES = 4000;

export interface ClientActionResult {
  clientId?: string;
  error?: string;
}

function readFields(formData: FormData) {
  return {
    name: ((formData.get("name") as string) ?? "").trim(),
    email: ((formData.get("email") as string) ?? "").trim(),
    company: ((formData.get("company") as string) ?? "").trim(),
    status: ((formData.get("status") as string) ?? "active").trim(),
    notes: ((formData.get("notes") as string) ?? "").trim(),
  };
}

function validate(fields: ReturnType<typeof readFields>): string | null {
  if (!fields.name) return "Name is required";
  if (fields.name.length > MAX_NAME) {
    return `Name must be ${MAX_NAME} characters or fewer`;
  }
  if (fields.email.length > MAX_EMAIL) {
    return `Email must be ${MAX_EMAIL} characters or fewer`;
  }
  if (fields.company.length > MAX_COMPANY) {
    return `Company must be ${MAX_COMPANY} characters or fewer`;
  }
  if (fields.notes.length > MAX_NOTES) {
    return `Notes must be ${MAX_NOTES} characters or fewer`;
  }
  if (!ALLOWED_STATUSES.has(fields.status)) {
    return "Pick a valid status";
  }
  return null;
}

export async function createClientRecord(
  formData: FormData,
): Promise<ClientActionResult> {
  const fields = readFields(formData);
  const error = validate(fields);
  if (error) return { error };

  const supabase = await createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error: insertErr } = await supabase
    .from("clients")
    .insert({
      user_id: user.id,
      name: fields.name,
      email: fields.email || null,
      company: fields.company || null,
      status: fields.status as ClientStatus,
      notes: fields.notes || null,
    })
    .select("id")
    .single();

  if (insertErr || !data) {
    return { error: "Could not save client — try again." };
  }

  revalidatePath("/me/clients");
  return { clientId: data.id };
}

export async function updateClientRecord(
  formData: FormData,
): Promise<ClientActionResult> {
  const id = ((formData.get("id") as string) ?? "").trim();
  if (!id) return { error: "Missing client id" };

  const fields = readFields(formData);
  const error = validate(fields);
  if (error) return { error };

  const supabase = await createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error: updateErr } = await supabase
    .from("clients")
    .update({
      name: fields.name,
      email: fields.email || null,
      company: fields.company || null,
      status: fields.status as ClientStatus,
      notes: fields.notes || null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateErr) {
    return { error: "Could not update client — try again." };
  }

  revalidatePath("/me/clients");
  revalidatePath(`/me/clients/${id}`);
  return { clientId: id };
}

export async function deleteClientRecord(formData: FormData) {
  const id = ((formData.get("id") as string) ?? "").trim();
  if (!id) return;

  const supabase = await createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("clients")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/me/clients");
  redirect("/me/clients");
}
