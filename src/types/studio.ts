export interface StudioImage {
  id: string;
  project_id: string;
  user_id?: string;
  prompt: string;
  storage_path: string;
  signed_url: string;
  model: string;
  created_at: string;
}
