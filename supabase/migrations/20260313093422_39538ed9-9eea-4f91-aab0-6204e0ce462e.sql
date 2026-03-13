
-- Replace overly permissive INSERT policy with a restricted one
DROP POLICY "System can insert notifications" ON public.notifications;

-- Only allow inserts where user_id matches the authenticated user (for edge functions)
-- The triggers use SECURITY DEFINER so they bypass RLS entirely
CREATE POLICY "Users can insert own notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
