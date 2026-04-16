
DROP POLICY "Jury can delete protocols" ON public.jury_protocols;
CREATE POLICY "GF can delete protocols"
ON public.jury_protocols
FOR DELETE
USING (has_role(auth.uid(), 'geschaeftsfuehrung'::app_role));

DROP POLICY "Jury can delete signatures" ON public.jury_protocol_signatures;
CREATE POLICY "GF can delete signatures"
ON public.jury_protocol_signatures
FOR DELETE
USING (has_role(auth.uid(), 'geschaeftsfuehrung'::app_role));
