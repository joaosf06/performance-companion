import { supabase } from "@/integrations/supabase/client";

export const uploadSiteAsset = async (file: File) => {
  const clean = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `home/${Date.now()}-${clean}`;
  const { error } = await supabase.storage.from("site-assets").upload(path, file);
  if (error) throw error;
  return supabase.storage.from("site-assets").getPublicUrl(path).data.publicUrl;
};

export interface SiteAsset {
  name: string;
  path: string;
  url: string;
  isImage: boolean;
  updatedAt: string | null;
}

const IMAGE_RE = /\.(png|jpe?g|gif|webp|avif|svg|bmp)$/i;

const listFolder = async (prefix: string): Promise<SiteAsset[]> => {
  const { data, error } = await supabase.storage
    .from("site-assets")
    .list(prefix, { limit: 200, sortBy: { column: "created_at", order: "desc" } });
  if (error || !data) return [];

  const assets: SiteAsset[] = [];
  const folders: string[] = [];

  for (const entry of data) {
    if (entry.name.startsWith(".")) continue;
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (!entry.id) {
      folders.push(path);
      continue;
    }
    assets.push({
      name: entry.name,
      path,
      url: supabase.storage.from("site-assets").getPublicUrl(path).data.publicUrl,
      isImage: IMAGE_RE.test(entry.name),
      updatedAt: entry.updated_at ?? entry.created_at ?? null,
    });
  }

  const nested = await Promise.all(folders.map((folder) => listFolder(folder)));
  return [...assets, ...nested.flat()];
};

export const listSiteAssets = async (onlyImages = false) => {
  const all = await listFolder("");
  const filtered = onlyImages ? all.filter((a) => a.isImage) : all;
  return filtered.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
};
