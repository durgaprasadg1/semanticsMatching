import { z } from "zod";

export const createFolderSchema = z.object({
  name: z.string().min(1).max(200),
  parent_folder_id: z.string().uuid().nullable().optional(),
});

export const updateFolderSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  parent_folder_id: z.string().uuid().nullable().optional(),
});

export const createFileSchema = z.object({
  title: z.string().min(1).max(300),
  folder_id: z.string().uuid().nullable().optional(),
  content: z.string().optional().default(""),
  file_type: z.enum(["md", "txt"]).optional().default("md"),
});

export const updateFileSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  folder_id: z.string().uuid().nullable().optional(),
  content: z.string().optional(),
});
