import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, CheckCircle2, Calendar, Users, PenLine, Trash2, Download, Sparkles, Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAiAssist } from '@/hooks/useAiAssist';
import { exportProtocolPdf } from '@/lib/protocol-pdf';
import { Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';

type Protocol = {
  id: string;
  meeting_date: string;
  attendees: string[];
  is_quorate: boolean;
  notes: string;
  decisions: any[];
  created_by: string;
  created_at: string;
};

type ProtocolSuggestionLink = {
  id: string;
  protocol_id: string;
  suggestion_id: string;
};

type SuggestionLite = {
  id: string;
  title: string;
  status: string;
  premium_class: number | null;
};

type Signature = {
  id: string;
  protocol_id: string;
  user_id: string;
  signed_at: string;
};

const JURY_ROLES = [
  'Leitung Personalabteilung',
  'Vertretung Geschäftsführung',
  'Vertretung Personalrat',
];

export default function JuryProtocols() {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const { improveProtocolNotes, improveDecisions, draftDecisionsFromNotes, loading: aiLoading } = useAiAssist();
  const [createOpen, setCreateOpen] = useState(false);
  const [meetingDate, setMeetingDate] = useState('');
  const [attendees, setAttendees] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [decisions, setDecisions] = useState('');
  const [linkedSuggestionIds, setLinkedSuggestionIds] = useState<string[]>([]);

  const { data: protocols = [], isLoading } = useQuery({
    queryKey: ['jury_protocols'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jury_protocols')
        .select('*')
        .order('meeting_date', { ascending: false });
      if (error) throw error;
      return data as Protocol[];
    },
  });

  const { data: signatures = [] } = useQuery({
    queryKey: ['jury_protocol_signatures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jury_protocol_signatures')
        .select('*');
      if (error) throw error;
      return data as Signature[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, display_name');
      if (error) throw error;
      return data;
    },
  });

  const { data: suggestions = [] } = useQuery({
    queryKey: ['suggestions_lite'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suggestions')
        .select('id, title, status, premium_class')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SuggestionLite[];
    },
  });

  const { data: protocolSuggestions = [] } = useQuery({
    queryKey: ['jury_protocol_suggestions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jury_protocol_suggestions')
        .select('*');
      if (error) throw error;
      return data as ProtocolSuggestionLink[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const isQuorate = attendees.length === JURY_ROLES.length;
      let parsedDecisions: any[] = [];
      try {
        if (decisions.trim()) {
          parsedDecisions = decisions.split('\n').filter(Boolean).map((d, i) => ({ id: i + 1, text: d.trim() }));
        }
      } catch { /* ignore */ }

      const { data: inserted, error } = await supabase.from('jury_protocols').insert({
        meeting_date: meetingDate,
        attendees,
        is_quorate: isQuorate,
        notes,
        decisions: parsedDecisions,
        created_by: user!.id,
      }).select('id').single();
      if (error) throw error;

      if (inserted && linkedSuggestionIds.length > 0) {
        const { error: linkErr } = await supabase
          .from('jury_protocol_suggestions')
          .insert(linkedSuggestionIds.map(sid => ({ protocol_id: inserted.id, suggestion_id: sid })));
        if (linkErr) throw linkErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jury_protocols'] });
      queryClient.invalidateQueries({ queryKey: ['jury_protocol_suggestions'] });
      toast.success('Protokoll erstellt');
      setCreateOpen(false);
      setMeetingDate('');
      setAttendees([]);
      setNotes('');
      setDecisions('');
      setLinkedSuggestionIds([]);
    },
    onError: () => toast.error('Fehler beim Erstellen'),
  });

  const signMutation = useMutation({
    mutationFn: async (protocolId: string) => {
      const { error } = await supabase.from('jury_protocol_signatures').insert({
        protocol_id: protocolId,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jury_protocol_signatures'] });
      toast.success('Protokoll unterschrieben');
    },
    onError: (err: any) => {
      if (err.message?.includes('duplicate')) {
        toast.error('Sie haben bereits unterschrieben');
      } else {
        toast.error('Fehler beim Unterschreiben');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (protocolId: string) => {
      const { error: sigErr } = await supabase.from('jury_protocol_signatures').delete().eq('protocol_id', protocolId);
      if (sigErr) throw sigErr;
      const { error } = await supabase.from('jury_protocols').delete().eq('id', protocolId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jury_protocols'] });
      queryClient.invalidateQueries({ queryKey: ['jury_protocol_signatures'] });
      toast.success('Protokoll gelöscht');
    },
    onError: () => toast.error('Fehler beim Löschen'),
  });

  const getProfileName = (id: string) => profiles.find(p => p.id === id)?.display_name || 'Unbekannt';

  const toggleAttendee = (role: string) => {
    setAttendees(prev => prev.includes(role) ? prev.filter(a => a !== role) : [...prev, role]);
  };

  const exportCSV = () => {
    if (protocols.length === 0) return toast.error('Keine Protokolle zum Exportieren');
    const header = ['Sitzungsdatum', 'Beschlussfähig', 'Anwesende', 'Beratung/Notizen', 'Beschlüsse', 'Unterschriften', 'Erstellt von', 'Erstellt am'];
    const rows = protocols.map(p => {
      const sigs = signatures.filter(s => s.protocol_id === p.id).map(s => `${getProfileName(s.user_id)} (${new Date(s.signed_at).toLocaleDateString('de-DE')})`).join(', ');
      const decs = Array.isArray(p.decisions) ? p.decisions.map((d: any) => d.text || String(d)).join('; ') : '';
      return [
        new Date(p.meeting_date).toLocaleDateString('de-DE'),
        p.is_quorate ? 'Ja' : 'Nein',
        p.attendees.join(', '),
        p.notes,
        decs,
        sigs || '-',
        getProfileName(p.created_by),
        new Date(p.created_at).toLocaleDateString('de-DE'),
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(';');
    });
    const csv = '\uFEFF' + header.join(';') + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jury_protokolle_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportiert');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6 text-primary" /> Sitzungsprotokolle</h1>
          <p className="mt-1 text-muted-foreground">Protokolle der Jury-Sitzungen (§5.6)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" /> CSV-Export
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Neues Protokoll
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Laden...</p>
      ) : protocols.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Noch keine Protokolle vorhanden.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {protocols.map(protocol => {
            const protocolSigs = signatures.filter(s => s.protocol_id === protocol.id);
            const hasSigned = protocolSigs.some(s => s.user_id === user?.id);
            const decisions = Array.isArray(protocol.decisions) ? protocol.decisions : [];
            const linkedSugIds = protocolSuggestions.filter(l => l.protocol_id === protocol.id).map(l => l.suggestion_id);
            const linkedSugs = suggestions.filter(s => linkedSugIds.includes(s.id));

            return (
              <Card key={protocol.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        Sitzung vom {new Date(protocol.meeting_date).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant={protocol.is_quorate ? 'default' : 'destructive'}>
                          {protocol.is_quorate ? 'Beschlussfähig' : 'Nicht beschlussfähig'}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" /> {protocol.attendees.length}/{JURY_ROLES.length} Mitglieder
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Lightbulb className="h-3 w-3" /> {linkedSugs.length} {linkedSugs.length === 1 ? 'Vorschlag' : 'Vorschläge'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-primary"
                        title="Als PDF exportieren"
                        onClick={() => {
                          exportProtocolPdf(protocol, signatures, getProfileName, linkedSugs);
                          toast.success('PDF wird heruntergeladen');
                        }}
                      >
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-primary"
                        title="Als PDF exportieren"
                        onClick={() => {
                          exportProtocolPdf(protocol, signatures, getProfileName);
                          toast.success('PDF wird heruntergeladen');
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {hasRole('geschaeftsfuehrung') && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Protokoll löschen?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Das Protokoll vom {new Date(protocol.meeting_date).toLocaleDateString('de-DE')} wird unwiderruflich gelöscht, einschließlich aller Unterschriften.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(protocol.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Löschen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Anwesend</p>
                    <div className="flex flex-wrap gap-1.5">
                      {protocol.attendees.map(a => (
                        <Badge key={a} variant="outline">{a}</Badge>
                      ))}
                    </div>
                  </div>

                  {protocol.notes && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Beratung (vertraulich)</p>
                      <p className="text-sm whitespace-pre-wrap">{protocol.notes}</p>
                    </div>
                  )}

                  {decisions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Beschlüsse</p>
                      <ul className="space-y-1">
                        {decisions.map((d: any, i: number) => (
                          <li key={i} className="text-sm flex gap-2">
                            <span className="text-muted-foreground">{i + 1}.</span>
                            <span>{d.text || String(d)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Unterschriften ({protocolSigs.length})</p>
                    <div className="flex flex-wrap items-center gap-3">
                      {protocolSigs.map(sig => (
                        <span key={sig.id} className="inline-flex items-center gap-1.5 text-sm text-success">
                          <CheckCircle2 className="h-4 w-4" />
                          {getProfileName(sig.user_id)} – {new Date(sig.signed_at).toLocaleDateString('de-DE')}
                        </span>
                      ))}
                      {!hasSigned && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => signMutation.mutate(protocol.id)}
                          disabled={signMutation.isPending}
                        >
                          <PenLine className="mr-1.5 h-3.5 w-3.5" /> Unterschreiben
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Neues Sitzungsprotokoll</DialogTitle>
            <DialogDescription>Protokoll gemäß §5.6 der Dienstvereinbarung.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Sitzungsdatum</Label>
              <Input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Anwesende Mitglieder</Label>
              <p className="text-xs text-muted-foreground">Beschlussfähig bei Anwesenheit aller Mitglieder (§5.2)</p>
              {JURY_ROLES.map(role => (
                <div key={role} className="flex items-center gap-2">
                  <Checkbox
                    id={role}
                    checked={attendees.includes(role)}
                    onCheckedChange={() => toggleAttendee(role)}
                  />
                  <label htmlFor={role} className="text-sm cursor-pointer">{role}</label>
                </div>
              ))}
              {attendees.length === JURY_ROLES.length && (
                <Badge className="mt-1">Beschlussfähig ✓</Badge>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Beratung & Notizen</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5 text-primary hover:text-primary"
                  disabled={!notes.trim() || aiLoading['improve_protocol_notes']}
                  onClick={async () => {
                    const improved = await improveProtocolNotes(notes, { meeting_date: meetingDate });
                    if (improved) {
                      setNotes(improved);
                      toast.success('Beratungstext verbessert');
                    }
                  }}
                >
                  {aiLoading['improve_protocol_notes'] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  KI-Verbesserung
                </Button>
              </div>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Vertrauliche Beratungsnotizen..." rows={4} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Beschlüsse (ein Beschluss pro Zeile)</Label>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1.5 text-primary hover:text-primary"
                    disabled={!notes.trim() || aiLoading['draft_decisions_from_notes']}
                    onClick={async () => {
                      const drafted = await draftDecisionsFromNotes(notes, { meeting_date: meetingDate });
                      if (drafted && drafted.length > 0) {
                        setDecisions(drafted.join('\n'));
                        toast.success(`${drafted.length} Beschluss-Entwürfe generiert`);
                      }
                    }}
                  >
                    {aiLoading['draft_decisions_from_notes'] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                    Aus Notizen ableiten
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1.5 text-primary hover:text-primary"
                    disabled={!decisions.trim() || aiLoading['improve_decisions']}
                    onClick={async () => {
                      const improved = await improveDecisions(decisions, { meeting_date: meetingDate });
                      if (improved) {
                        setDecisions(improved);
                        toast.success('Beschlüsse verbessert');
                      }
                    }}
                  >
                    {aiLoading['improve_decisions'] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    KI-Verbesserung
                  </Button>
                </div>
              </div>
              <Textarea value={decisions} onChange={e => setDecisions(e.target.value)} placeholder="Vorschlag X angenommen, Klasse 2&#10;Vorschlag Y abgelehnt" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Abbrechen</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!meetingDate || attendees.length === 0 || createMutation.isPending}
            >
              Protokoll erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
