-- Public read access for site design assets
CREATE POLICY "Public can view site assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-assets');

-- Only authenticated users can upload
CREATE POLICY "Authenticated can upload site assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'site-assets');

-- Only authenticated users can update
CREATE POLICY "Authenticated can update site assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'site-assets');

-- Only authenticated users can delete
CREATE POLICY "Authenticated can delete site assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'site-assets');