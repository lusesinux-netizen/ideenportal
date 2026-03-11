
-- Add review_started_at to track when a suggestion enters review
ALTER TABLE public.suggestions ADD COLUMN review_started_at timestamp with time zone;

-- Create jury_protocols table for meeting minutes
CREATE TABLE public.jury_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_date date NOT NULL,
  attendees text[] NOT NULL DEFAULT '{}',
  is_quorate boolean NOT NULL DEFAULT false,
  notes text NOT NULL DEFAULT '',
  decisions jsonb NOT NULL DEFAULT '[]',
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create jury_protocol_signatures for digital signatures
CREATE TABLE public.jury_protocol_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid REFERENCES public.jury_protocols(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  signed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(protocol_id, user_id)
);

-- Enable RLS
ALTER TABLE public.jury_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jury_protocol_signatures ENABLE ROW LEVEL SECURITY;

-- Jury and GF can view protocols
CREATE POLICY "Jury can view protocols" ON public.jury_protocols
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'jury'::app_role) OR has_role(auth.uid(), 'geschaeftsfuehrung'::app_role));

-- Jury and GF can create protocols
CREATE POLICY "Jury can create protocols" ON public.jury_protocols
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'jury'::app_role) OR has_role(auth.uid(), 'geschaeftsfuehrung'::app_role));

-- Jury and GF can update protocols
CREATE POLICY "Jury can update protocols" ON public.jury_protocols
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'jury'::app_role) OR has_role(auth.uid(), 'geschaeftsfuehrung'::app_role));

-- Signatures: jury can view
CREATE POLICY "Jury can view signatures" ON public.jury_protocol_signatures
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'jury'::app_role) OR has_role(auth.uid(), 'geschaeftsfuehrung'::app_role));

-- Signatures: jury can insert own
CREATE POLICY "Jury can sign protocols" ON public.jury_protocol_signatures
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  (has_role(auth.uid(), 'jury'::app_role) OR has_role(auth.uid(), 'geschaeftsfuehrung'::app_role))
);

-- Updated_at trigger for protocols
CREATE TRIGGER update_jury_protocols_updated_at
  BEFORE UPDATE ON public.jury_protocols
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
