
-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  suggestion_id uuid REFERENCES public.suggestions(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'status_change', 'interim_notice', 'premium_decision'
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id, created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to create notifications on status change
CREATE OR REPLACE FUNCTION public.notify_on_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  status_labels jsonb := '{"eingereicht":"Eingereicht","in_pruefung":"In Prüfung","angenommen":"Angenommen","abgelehnt":"Abgelehnt","umgesetzt":"Umgesetzt"}'::jsonb;
  old_label text;
  new_label text;
  suggestion_title text;
BEGIN
  -- Only fire on status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  old_label := COALESCE(status_labels->>OLD.status, OLD.status);
  new_label := COALESCE(status_labels->>NEW.status, NEW.status);
  suggestion_title := NEW.title;

  -- Notify the submitter
  INSERT INTO public.notifications (user_id, suggestion_id, type, title, message)
  VALUES (
    NEW.submitted_by,
    NEW.id,
    'status_change',
    'Status geändert: ' || suggestion_title,
    'Ihr Vorschlag "' || suggestion_title || '" wurde von "' || old_label || '" auf "' || new_label || '" geändert.'
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_status_change
  AFTER UPDATE ON public.suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_status_change();

-- Function to notify on premium decision
CREATE OR REPLACE FUNCTION public.notify_on_premium_decision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only fire when premium_class changes from null to a value, or premium_choice changes
  IF (OLD.premium_class IS NULL AND NEW.premium_class IS NOT NULL) OR
     (OLD.premium_choice IS DISTINCT FROM NEW.premium_choice AND NEW.premium_choice IS NOT NULL) THEN
    INSERT INTO public.notifications (user_id, suggestion_id, type, title, message)
    VALUES (
      NEW.submitted_by,
      NEW.id,
      'premium_decision',
      'Prämie festgelegt: ' || NEW.title,
      'Für Ihren Vorschlag "' || NEW.title || '" wurde eine Prämie der Klasse ' || COALESCE(NEW.premium_class::text, '-') || ' festgelegt.'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_premium_decision
  AFTER UPDATE ON public.suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_premium_decision();
