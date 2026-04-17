CREATE TABLE public.jury_protocol_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid NOT NULL REFERENCES public.jury_protocols(id) ON DELETE CASCADE,
  suggestion_id uuid NOT NULL REFERENCES public.suggestions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (protocol_id, suggestion_id)
);

CREATE INDEX idx_jps_protocol ON public.jury_protocol_suggestions(protocol_id);
CREATE INDEX idx_jps_suggestion ON public.jury_protocol_suggestions(suggestion_id);

ALTER TABLE public.jury_protocol_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jury can view protocol-suggestion links"
ON public.jury_protocol_suggestions FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'jury'::app_role) OR has_role(auth.uid(), 'geschaeftsfuehrung'::app_role));

CREATE POLICY "Jury can create protocol-suggestion links"
ON public.jury_protocol_suggestions FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'jury'::app_role) OR has_role(auth.uid(), 'geschaeftsfuehrung'::app_role));

CREATE POLICY "Jury can delete protocol-suggestion links"
ON public.jury_protocol_suggestions FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'jury'::app_role) OR has_role(auth.uid(), 'geschaeftsfuehrung'::app_role));