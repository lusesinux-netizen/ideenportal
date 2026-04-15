
CREATE POLICY "Jury can delete protocols"
ON public.jury_protocols
FOR DELETE
USING (has_role(auth.uid(), 'jury'::app_role) OR has_role(auth.uid(), 'geschaeftsfuehrung'::app_role));

CREATE POLICY "Jury can delete signatures"
ON public.jury_protocol_signatures
FOR DELETE
USING (has_role(auth.uid(), 'jury'::app_role) OR has_role(auth.uid(), 'geschaeftsfuehrung'::app_role));
