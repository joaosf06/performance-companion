import { supabase } from "@/integrations/supabase/client";

export const uploadSiteAsset = async (file: File) => {
  const clean = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `home/${Date.now()}-${clean}`;
  const { error } = await supabase.storage.from("site-assets").upload(path, file);
  if (error) throw error;
  return supabase.storage.from("site-assets").getPublicUrl(path).data.publicUrl;
};
