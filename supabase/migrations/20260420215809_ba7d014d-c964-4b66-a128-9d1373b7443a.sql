-- Add parent_id to library_folders for nested folder support
ALTER TABLE public.library_folders
  ADD COLUMN parent_id UUID REFERENCES public.library_folders(id) ON DELETE CASCADE;

CREATE INDEX idx_library_folders_parent ON public.library_folders(parent_id);

-- Helper function: walk up the parent chain to check if any ancestor folder is assigned to the athlete
CREATE OR REPLACE FUNCTION public.is_assigned_folder_or_ancestor(_athlete_id uuid, _folder_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_id UUID := _folder_id;
  depth INT := 0;
BEGIN
  WHILE current_id IS NOT NULL AND depth < 20 LOOP
    IF EXISTS (
      SELECT 1 FROM public.library_folder_assignments
      WHERE folder_id = current_id AND athlete_id = _athlete_id
    ) THEN
      RETURN TRUE;
    END IF;
    SELECT parent_id INTO current_id FROM public.library_folders WHERE id = current_id;
    depth := depth + 1;
  END LOOP;
  RETURN FALSE;
END;
$$;

-- Update athlete view policy on folders to include subfolders of assigned folders
DROP POLICY IF EXISTS "Athletes can view assigned folders" ON public.library_folders;
CREATE POLICY "Athletes can view assigned folders"
ON public.library_folders
FOR SELECT
TO authenticated
USING (public.is_assigned_folder_or_ancestor(auth.uid(), id));

-- Update athlete view policy on files to include files in subfolders of assigned folders
DROP POLICY IF EXISTS "Athletes can view assigned folder files" ON public.library_files;
CREATE POLICY "Athletes can view assigned folder files"
ON public.library_files
FOR SELECT
TO authenticated
USING (public.is_assigned_folder_or_ancestor(auth.uid(), folder_id));