// Hand-written types matching the schema in supabase/migrations/.
// Swap for `supabase gen types typescript` output once the project is linked.
export type Folder = {
  id: string;
  user_id: string;
  name: string;
  parent_folder_id: string | null;
  created_at: string;
  updated_at: string;
};

export type FileRow = {
  id: string;
  user_id: string;
  folder_id: string | null;
  title: string;
  content: string;
  file_type: "md" | "txt";
  created_at: string;
  updated_at: string;
};

export type LinkType = "structural" | "semantic";

export type FileLink = {
  id: string;
  user_id: string;
  source_file_id: string;
  target_file_id: string | null;
  target_folder_id: string | null;
  link_type: LinkType;
  similarity_score: number | null;
  created_at: string;
};

export type GraphNode = {
  id: string;
  label: string;
  type: "file" | "folder";
  folder_id: string | null;
};

export type GraphEdge = {
  source: string;
  target: string;
  link_type: LinkType;
  similarity_score: number | null;
};
