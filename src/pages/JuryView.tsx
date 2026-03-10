import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronDown, ChevronUp, Calendar, MapPin, Users, Send, Award, AlertTriangle, CheckCircle2, XCircle, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/StatusBadge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchSuggestions, updateSuggestion, DbSuggestion } from '@/lib/supabase-helpers';
import { toast } from 'sonner';

const scopeLabels: Record<string, string> = { arbeitsplatz: 'Eigener Arbeitsplatz', abteilung: 'Abteilung', kammer: 'Gesamte Kammer' };

const statusActions = [
  { value: 'eingereicht', label: 'Eingereicht', icon: FileText },
  { value: 'in_pruefung', label: 'In Prüfung', icon: Clock },
  { value: 'angenommen', label: 'Angenommen', icon: CheckCircle2 },
  { value: 'abgelehnt', label: 'Abgelehnt', icon: XCircle },
  { value: 'umgesetzt', label: 'Umgesetzt', icon: CheckCircle2 },
];

const premiumOptions = [
  { value: '1', label: 'Klasse 1 – Arbeitsplatz' },
  { value: '2', label: 'Klasse 2 – Abteilung' },
  { value: '3', label: 'Klasse 3 – Organisation' },
  { value: '4', label: 'Klasse 4 – Individuell' },
];

function JuryReviewCard({ suggestion: s }: { suggestion: DbSuggestion }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState(s.jury_comment || '');
  const [status, setStatus] = useState(s.status);
  const [premiumClass, setPremiumClass] = useState(s.premium_class?.toString() || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSuggestion(s.id, {
        status,
        jury_comment: comment || null,
        premium_class: premiumClass ? parseInt(premiumClass) : null,
      });
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      toast.success(`Bewertung für "${s.title}" gespeichert`);
      setExpanded(false);
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Speichern.');
    } finally {
      setSaving(false);
    }
  };

  const daysSince = Math.floor((Date.now() - new Date(s.created_at).getTime()) / 86400000);
  const needsInterim = daysSince > 42 && (status === 'eingereicht' || status === 'in_pruefung');

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border bg-card shadow-card overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-start gap-4 p-5 text-left hover:bg-muted/30 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <StatusBadge status={status} />
            <span className="text-xs text-muted-foreground">{s.category}</span>
            {needsInterim && <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 border border-warning/20 px-2 py-0.5 text-xs font-semibold text-warning"><AlertTriangle className="h-3 w-3" /> Zwischenbescheid nötig</span>}
          </div>
          <h3 className="font-semibold text-card-foreground">{s.title}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(s.created_at).toLocaleDateString('de-DE')}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{scopeLabels[s.scope] || s.scope}</span>
            {(s.suggestion_team_members?.length ?? 0) > 0 && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />+{s.suggestion_team_members!.length}</span>}
          </div>
        </div>
        {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="border-t px-5 pb-5 pt-4 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Problem</p><p className="text-sm leading-relaxed mt-1">{s.problem_description}</p></div>
                <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lösung</p><p className="text-sm leading-relaxed mt-1">{s.solution_description}</p></div>
                <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nutzen</p><p className="text-sm leading-relaxed mt-1">{s.expected_benefit}</p></div>
                <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Realisierbarkeit</p><p className="text-sm leading-relaxed mt-1">{s.feasibility}</p></div>
              </div>

              {needsInterim && (
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Zwischenbescheid erforderlich ({daysSince} Tage)</p>
                    <Button size="sm" variant="outline" className="mt-2 border-warning/30 text-warning hover:bg-warning/10" onClick={e => { e.stopPropagation(); toast.success('Zwischenbescheid wurde versendet.'); }}>
                      <Send className="mr-2 h-3.5 w-3.5" /> Zwischenbescheid senden
                    </Button>
                  </div>
                </div>
              )}

              <div className="rounded-lg border bg-muted/30 p-5 space-y-4">
                <h4 className="font-semibold flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Jury-Bewertung</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Status ändern</Label>
                    <Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statusActions.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Prämienklasse</Label>
                    <Select value={premiumClass} onValueChange={setPremiumClass}><SelectTrigger><SelectValue placeholder="Klasse wählen" /></SelectTrigger><SelectContent>{premiumOptions.map(p => <SelectItem key={p.value} value={p.value}><Award className="h-3.5 w-3.5 inline mr-1" />{p.label}</SelectItem>)}</SelectContent></Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Kommentar</Label><Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Bewertung und Begründung..." rows={3} /></div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" size="sm" onClick={() => setExpanded(false)}>Abbrechen</Button>
                  <Button size="sm" className="gradient-primary text-primary-foreground hover:opacity-90" onClick={handleSave} disabled={saving}>{saving ? 'Speichern...' : 'Bewertung speichern'}</Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function JuryView() {
  const [filter, setFilter] = useState('offen');
  const { data: suggestions = [] } = useQuery({ queryKey: ['suggestions'], queryFn: fetchSuggestions });

  const filtered = suggestions.filter(s => {
    if (filter === 'offen') return s.status === 'eingereicht' || s.status === 'in_pruefung';
    if (filter === 'entschieden') return s.status === 'angenommen' || s.status === 'abgelehnt' || s.status === 'umgesetzt';
    return true;
  });

  const openCount = suggestions.filter(s => s.status === 'eingereicht' || s.status === 'in_pruefung').length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /> Jury-Bewertung</h1>
          <p className="mt-1 text-muted-foreground">{openCount} Vorschläge warten auf Bewertung</p>
        </div>
        <div className="flex rounded-lg border bg-muted/50 p-1">
          {[{ value: 'offen', label: `Offen (${openCount})` }, { value: 'entschieden', label: 'Entschieden' }, { value: 'alle', label: 'Alle' }].map(tab => (
            <button key={tab.value} onClick={() => setFilter(tab.value)} className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${filter === tab.value ? 'bg-card shadow-card text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{tab.label}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Eingereicht', count: suggestions.filter(s => s.status === 'eingereicht').length, color: 'text-info' },
          { label: 'In Prüfung', count: suggestions.filter(s => s.status === 'in_pruefung').length, color: 'text-warning' },
          { label: 'Angenommen', count: suggestions.filter(s => s.status === 'angenommen').length, color: 'text-success' },
          { label: 'Abgelehnt', count: suggestions.filter(s => s.status === 'abgelehnt').length, color: 'text-destructive' },
        ].map(stat => (
          <div key={stat.label} className="rounded-lg border bg-card p-3 text-center shadow-card"><p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length > 0 ? filtered.map(s => <JuryReviewCard key={s.id} suggestion={s} />) : (
          <div className="text-center py-12 text-muted-foreground"><Shield className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>Keine Vorschläge in dieser Kategorie.</p></div>
        )}
      </div>
    </motion.div>
  );
}
