export type ClientStatus = "active" | "paused" | "past";

export const CLIENT_STATUSES: ClientStatus[] = ["active", "paused", "past"];

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  active: "Active",
  paused: "Paused",
  past: "Past",
};

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  company: string | null;
  status: ClientStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
