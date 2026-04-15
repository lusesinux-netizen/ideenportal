import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, ChevronDown, ChevronUp, Calendar, MapPin, Users, Award, Euro, Save, AlertTriangle, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import StatusBadge from '@/components/StatusBadge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchSuggestions, updateSuggestion, DbSuggestion } from '@/lib/supabase-helpers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const scopeLabels: Record<string, string> = {
  arbeitsplatz: 'Eigener Arbeitsplatz',
  abteilung: 'Abteilung',
  kammer: 'Gesamte Kammer',
};

const PREMIUM_INFO: Record<number, { label: string; options: string }> = {
  1: { label: 'Klasse 1 – Arbeitsplatz', options: '1 Urlaubstag oder 100 €' },
  2: { label: 'Klasse 2 – Abteilung', options: '2 Urlaubstage oder 200 €' },
  3: { label: 'Klasse 3 – Organisation', options: '3 Urlaubstage oder 300 €' },
  4: { label: 'Klasse 4 – Individuell', options: 'Individuelle Festlegung durch GF' },
};

function Klasse4Card({ suggestion: s }: { suggestion: DbSuggestion }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [premiumAmount, setPremiumAmount] = useState((s as any).premium_amount || '');
  const [premiumNote, setPremiumNote] = useState((s as any).premium_note || s.jury_comment || '');
  const [premiumChoice, setPremiumChoice] = useState(s.premium_choice || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!premiumChoice) {
      toast.error('Bitte Prämienart wählen');
      return;
    }
    setSaving(true);
    try {
      await updateSuggestion(s.id, {
        premium_choice: premiumChoice,
        jury_comment: premiumNote || null,
      });
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      toast.success(`Prämie für "${s.title}" festgelegt`);
      setExpanded(false);
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const teamCount = s.suggestion_team_members?.length ?? 0;

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border bg-card shadow-card overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-start gap-4 p-5 text-left hover:bg-muted/30 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <StatusBadge status={s.status} />
            <Badge variant="outline" className="bg-accent/10 text-accent-foreground border-accent/20">
              <Award className="h-3 w-3 mr-1" /> Klasse 4
            </Badge>
            <span className="text-xs text-muted-foreground">{s.category}</span>
            {s.premium_choice && (
              <Badge className="bg-success/10 text-success border-success/20">
                Prämie festgelegt
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-card-foreground">{s.title}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(s.created_at).toLocaleDateString('de-DE')}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{scopeLabels[s.scope] || s.scope}</span>
            {s.estimated_savings && <span className="flex items-center gap-1"><Euro className="h-3.5 w-3.5" />Einsparung: {s.estimated_savings} €</span>}
            {teamCount > 0 && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />Team: {teamCount + 1} Personen</span>}
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

              {s.estimated_savings && (
                <div className="rounded-lg border border-accent/20 bg-accent/5 p-4 flex gap-3">
                  <Euro className="h-5 w-5 text-accent-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Geschätzte Einsparung: {s.estimated_savings} €</p>
                    <p className="text-xs text-muted-foreground mt-1">Die Jury hat diesen Vorschlag als Klasse 4 (wirtschaftlicher Nutzen) eingestuft. Die Prämie wird individuell durch die Geschäftsführung festgelegt.</p>
                  </div>
                </div>
              )}

              {s.jury_comment && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Jury-Kommentar</p>
                  <p className="text-sm whitespace-pre-wrap">{s.jury_comment}</p>
                </div>
              )}

              {teamCount > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Team-Mitglieder (Prämie wird zu gleichen Teilen aufgeteilt)</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {s.suggestion_team_members!.map(m => (
                      <Badge key={m.id} variant="outline">{m.name}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-lg border bg-muted/30 p-5 space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" /> Individuelle Prämienfestlegung
                </h4>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Prämienart</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={premiumChoice === 'geld' ? 'default' : 'outline'}
                        onClick={() => setPremiumChoice('geld')}
                      >
                        <Euro className="mr-1.5 h-3.5 w-3.5" /> Geldprämie
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={premiumChoice === 'urlaub' ? 'default' : 'outline'}
                        onClick={() => setPremiumChoice('urlaub')}
                      >
                        <Calendar className="mr-1.5 h-3.5 w-3.5" /> Urlaubstage
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{premiumChoice === 'urlaub' ? 'Anzahl Urlaubstage' : 'Betrag in €'}</Label>
                    <Input
                      type="number"
                      min="1"
                      value={premiumAmount}
                      onChange={e => setPremiumAmount(e.target.value)}
                      placeholder={premiumChoice === 'urlaub' ? 'z.B. 5' : 'z.B. 1000'}
                    />
                  </div>
                </div>

                {teamCount > 0 && premiumAmount && (
                  <div className="rounded-md bg-info/10 border border-info/20 p-3 text-sm">
                    <p className="font-medium text-info">Aufteilung auf {teamCount + 1} Personen:</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {premiumChoice === 'urlaub'
                        ? `Je ${(parseFloat(premiumAmount) / (teamCount + 1)).toFixed(1)} Urlaubstage pro Person`
                        : `Je ${(parseFloat(premiumAmount) / (teamCount + 1)).toFixed(2)} € pro Person`}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Begründung / Anmerkung</Label>
                  <Textarea
                    value={premiumNote}
                    onChange={e => setPremiumNote(e.target.value)}
                    placeholder="Begründung für die Prämienhöhe..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" size="sm" onClick={() => setExpanded(false)}>Abbrechen</Button>
                  <Button
                    size="sm"
                    className="gradient-primary text-primary-foreground hover:opacity-90"
                    onClick={handleSave}
                    disabled={saving || !premiumChoice}
                  >
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                    {saving ? 'Speichern...' : 'Prämie festlegen'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ManagementView() {
  const queryClient = useQueryClient();
  const { data: suggestions = [] } = useQuery({ queryKey: ['suggestions'], queryFn: fetchSuggestions });
  const [filter, setFilter] = useState<'offen' | 'erledigt' | 'alle'>('offen');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      // Delete team members first, then notifications, then suggestions
      const { error: tmErr } = await supabase.from('suggestion_team_members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (tmErr) throw tmErr;
      const { error: nErr } = await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (nErr) throw nErr;
      const { error: sErr } = await supabase.from('suggestions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (sErr) throw sErr;
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      toast.success('Alle Vorschläge wurden gelöscht.');
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Löschen');
    } finally {
      setDeleting(false);
    }
  };

  const klasse4 = suggestions.filter(s => s.premium_class === 4);
  const openCount = klasse4.filter(s => !s.premium_choice).length;
  const doneCount = klasse4.filter(s => !!s.premium_choice).length;

  const filtered = klasse4.filter(s => {
    if (filter === 'offen') return !s.premium_choice;
    if (filter === 'erledigt') return !!s.premium_choice;
    return true;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" /> Geschäftsführung
          </h1>
          <p className="mt-1 text-muted-foreground">Individuelle Prämienfestlegung für Klasse-4-Vorschläge</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" disabled={suggestions.length === 0} onClick={() => {
            const headers = ['Titel','Kategorie','Status','Bereich','Problem','Lösung','Nutzen','Realisierbarkeit','Geschätzte Einsparung','Prämienklasse','Prämienart','Jury-Kommentar','Eingereicht am','Teammitglieder'];
            const escape = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`;
            const rows = suggestions.map(s => {
              const teamNames = s.suggestion_team_members?.map(m => m.name).join(', ') || '';
              return [
                s.title, s.category, s.status, scopeLabels[s.scope] || s.scope,
                s.problem_description, s.solution_description, s.expected_benefit, s.feasibility,
                s.estimated_savings || '', s.premium_class?.toString() || '', s.premium_choice || '',
                s.jury_comment || '', new Date(s.created_at).toLocaleDateString('de-DE'), teamNames,
              ].map(escape).join(';');
            });
            const csv = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `vorschlaege_export_${new Date().toISOString().slice(0,10)}.csv`; a.click();
            URL.revokeObjectURL(url);
            toast.success(`${suggestions.length} Vorschläge exportiert`);
          }}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> CSV-Export
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={suggestions.length === 0 || deleting}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                {deleting ? 'Lösche...' : 'Alle Vorschläge löschen'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Alle Vorschläge löschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Diese Aktion löscht <strong>alle {suggestions.length} Vorschläge</strong> unwiderruflich, einschließlich aller zugehörigen Daten (Teammitglieder, Benachrichtigungen). Dies kann nicht rückgängig gemacht werden.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Endgültig löschen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div className="flex rounded-lg border bg-muted/50 p-1">
          {[
            { value: 'offen' as const, label: `Offen (${openCount})` },
            { value: 'erledigt' as const, label: `Erledigt (${doneCount})` },
            { value: 'alle' as const, label: 'Alle' },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${filter === tab.value ? 'bg-card shadow-card text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {tab.label}
            </button>
          ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border bg-card p-3 text-center shadow-card">
          <p className="text-2xl font-bold text-primary">{klasse4.length}</p>
          <p className="text-xs text-muted-foreground">Klasse 4 gesamt</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center shadow-card">
          <p className="text-2xl font-bold text-warning">{openCount}</p>
          <p className="text-xs text-muted-foreground">Prämie offen</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center shadow-card">
          <p className="text-2xl font-bold text-success">{doneCount}</p>
          <p className="text-xs text-muted-foreground">Prämie festgelegt</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center shadow-card">
          <p className="text-2xl font-bold text-info">
            {klasse4.reduce((sum, s) => sum + (parseFloat(s.estimated_savings || '0') || 0), 0).toLocaleString('de-DE')} €
          </p>
          <p className="text-xs text-muted-foreground">Geschätzte Einsparungen</p>
        </div>
      </div>

      {klasse4.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Noch keine Klasse-4-Vorschläge vorhanden.</p>
          <p className="text-xs mt-1">Vorschläge werden hier angezeigt, sobald die Jury sie als Klasse 4 einstuft.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Award className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Keine Vorschläge in dieser Kategorie.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => <Klasse4Card key={s.id} suggestion={s} />)}
        </div>
      )}
    </motion.div>
  );
}
