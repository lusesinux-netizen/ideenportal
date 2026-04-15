
-- Allow Geschäftsführung to delete suggestions
CREATE POLICY "GF can delete suggestions"
ON public.suggestions
FOR DELETE
USING (has_role(auth.uid(), 'geschaeftsfuehrung'::app_role));

-- Allow Geschäftsführung to delete related team members
CREATE POLICY "GF can delete team members"
ON public.suggestion_team_members
FOR DELETE
USING (has_role(auth.uid(), 'geschaeftsfuehrung'::app_role));

-- Allow Geschäftsführung to delete related notifications
CREATE POLICY "GF can delete notifications"
ON public.notifications
FOR DELETE
USING (has_role(auth.uid(), 'geschaeftsfuehrung'::app_role));
