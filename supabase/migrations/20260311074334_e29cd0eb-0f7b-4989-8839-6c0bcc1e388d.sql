
-- Allow Geschäftsführung to insert roles
CREATE POLICY "GF can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'geschaeftsfuehrung'::app_role));

-- Allow Geschäftsführung to delete roles
CREATE POLICY "GF can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'geschaeftsfuehrung'::app_role));
