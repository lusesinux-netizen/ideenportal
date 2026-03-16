import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, X, Upload, Send, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { createSuggestion } from '@/lib/supabase-helpers';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const categories = [
  'Dienstleistungsqualität', 'Prozesse / Verwaltung', 'Personal / Organisation',
  'Arbeitsbedingungen', 'Umwelt / Nachhaltigkeit', 'Arbeitssicherheit', 'Kosten- oder Ressourceneinsparung',
];

const scopes = [
  { value: 'arbeitsplatz', label: 'Eigener Arbeitsplatz' },
  { value: 'abteilung', label: 'Abteilung' },
  { value: 'kammer', label: 'Gesamte Kammer' },
];

export default function SubmitSuggestion() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [benefit, setBenefit] = useState('');
  const [category, setCategory] = useState('');
  const [scope, setScope] = useState('');
  const [savings, setSavings] = useState('');
  const [feasibility, setFeasibility] = useState('');
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selfDecisionConfirm, setSelfDecisionConfirm] = useState(false);
  const [duplicates, setDuplicates] = useState<{ id: string; title: string; status: string; category: string }[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // Debounced AI-powered semantic duplicate check
  useEffect(() => {
    const trimmed = title.trim();
    if (trimmed.length < 5) {
      setDuplicates([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setCheckingDuplicates(true);
      try {
        const { data, error } = await supabase.functions.invoke('check-duplicates', {
          body: { title: trimmed, problem: problem.trim() || undefined },
        });

        if (error) {
          console.error('Duplicate check error:', error);
          setDuplicates([]);
        } else {
          setDuplicates(data?.duplicates ?? []);
        }
      } catch {
        setDuplicates([]);
      } finally {
        setCheckingDuplicates(false);
      }
    }, 800);

    return () => clearTimeout(timeout);
  }, [title, problem]);

  const addTeamMember = () => {
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;
    setTeamMembers([...teamMembers, { id: crypto.randomUUID(), name: newMemberName, email: newMemberEmail }]);
    setNewMemberName('');
    setNewMemberEmail('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !problem || !solution || !benefit || !category || !scope || !feasibility) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }
    if (!selfDecisionConfirm) {
      toast.error('Bitte bestätigen Sie, dass der Vorschlag nicht eigenständig umsetzbar ist.');
      return;
    }
    setSubmitting(true);
    try {
      await createSuggestion(
        {
          title, problem_description: problem, solution_description: solution,
          expected_benefit: benefit, category, scope,
          estimated_savings: savings || undefined, feasibility,
          submitted_by: user!.id,
        },
        teamMembers.map(m => ({ name: m.name, email: m.email }))
      );
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Ihr Vorschlag wurde erfolgreich eingereicht!');
      navigate('/vorschlaege');
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Einreichen.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Verbesserungsvorschlag einreichen</h1>
        <p className="mt-1 text-muted-foreground">Teilen Sie Ihre Idee und helfen Sie, die Handwerkskammer Berlin besser zu machen.</p>
      </div>

      <div className="mb-6 rounded-xl border border-info/20 bg-info/5 p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-info shrink-0 mt-0.5" />
          <div className="text-sm text-foreground">
            <p className="font-semibold mb-1">Hinweise für gültige Vorschläge:</p>
            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
              <li>Der Vorschlag muss eine konkrete Lösung enthalten</li>
              <li>Die Idee muss realisierbar und wirtschaftlich vertretbar sein</li>
              <li>Reine Problembeschreibungen ohne Lösung sind nicht zulässig</li>
            </ul>
            <p className="font-semibold mt-3 mb-1">Prämienberechtigung:</p>
            <p className="text-muted-foreground">Prämienberechtigt ist ein Vorschlag, der zum eigenen Arbeitsbereich gehört, aber <strong className="text-foreground">nicht selbst entschieden</strong> werden kann. Vorschläge, die in den eigenen Aufgabenbereich fallen und eigenständig umsetzbar sind, gelten nicht als prämienberechtigte Verbesserungsvorschläge.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-xl border bg-card p-6 shadow-card space-y-5">
          <h2 className="font-semibold text-lg">Allgemeine Informationen</h2>
          <div className="space-y-2">
            <Label htmlFor="title">Titel des Vorschlags *</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Kurzer, aussagekräftiger Titel" />
          </div>

          <AnimatePresence>
            {(duplicates.length > 0 || checkingDuplicates) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-lg border border-warning/30 bg-warning/5 p-4"
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    {checkingDuplicates ? (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> KI prüft auf inhaltlich ähnliche Vorschläge…
                      </p>
                    ) : (
                      <>
                        <p className="text-sm font-medium mb-2">Möglicherweise ähnliche Vorschläge gefunden:</p>
                        <ul className="space-y-1.5">
                          {duplicates.map(d => (
                            <li key={d.id} className="text-sm">
                              <Link
                                to={`/vorschlaege/${d.id}`}
                                className="text-primary hover:underline font-medium"
                                target="_blank"
                              >
                                {d.title}
                              </Link>
                              <span className="text-muted-foreground ml-2 text-xs">
                                ({d.category} · {d.status})
                              </span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-muted-foreground mt-2">
                          Bitte prüfen Sie, ob Ihr Vorschlag bereits eingereicht wurde, bevor Sie fortfahren.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="space-y-2"><Label htmlFor="problem">Beschreibung des Problems *</Label><Textarea id="problem" value={problem} onChange={e => setProblem(e.target.value)} placeholder="Beschreiben Sie die aktuelle Situation..." rows={3} /></div>
          <div className="space-y-2"><Label htmlFor="solution">Beschreibung der Lösung *</Label><Textarea id="solution" value={solution} onChange={e => setSolution(e.target.value)} placeholder="Beschreiben Sie Ihren Lösungsvorschlag..." rows={3} /></div>
          <div className="space-y-2"><Label htmlFor="benefit">Erwarteter Nutzen *</Label><Textarea id="benefit" value={benefit} onChange={e => setBenefit(e.target.value)} placeholder="Welchen Nutzen erwarten Sie?" rows={2} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kategorie *</Label>
              <Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue placeholder="Kategorie wählen" /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-2">
              <Label>Betrifft *</Label>
              <Select value={scope} onValueChange={setScope}><SelectTrigger><SelectValue placeholder="Auswirkungsbereich" /></SelectTrigger><SelectContent>{scopes.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-6 shadow-card space-y-5">
          <h2 className="font-semibold text-lg">Weitere Angaben</h2>
          <div className="space-y-2"><Label htmlFor="savings">Geschätzte Einsparungen (optional)</Label><Input id="savings" value={savings} onChange={e => setSavings(e.target.value)} placeholder="z. B. 5.000 € pro Jahr" /></div>
          <div className="space-y-2"><Label htmlFor="feasibility">Realisierbarkeit *</Label><Textarea id="feasibility" value={feasibility} onChange={e => setFeasibility(e.target.value)} placeholder="Wie schätzen Sie die Umsetzbarkeit ein?" rows={2} /></div>
        </section>

        <section className="rounded-xl border bg-card p-6 shadow-card space-y-5">
          <h2 className="font-semibold text-lg">Teamvorschlag</h2>
          <p className="text-sm text-muted-foreground">Optional: Fügen Sie Teammitglieder hinzu.</p>
          {teamMembers.length > 0 && (
            <div className="space-y-2">
              {teamMembers.map(m => (
                <div key={m.id} className="flex items-center gap-3 rounded-lg border bg-muted/50 px-3 py-2">
                  <span className="text-sm font-medium flex-1">{m.name}</span>
                  <span className="text-xs text-muted-foreground">{m.email}</span>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setTeamMembers(teamMembers.filter(t => t.id !== m.id))}><X className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <Input placeholder="Name" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} />
            <Input placeholder="E-Mail" value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} />
            <Button type="button" variant="secondary" onClick={addTeamMember} className="shrink-0"><PlusCircle className="mr-2 h-4 w-4" /> Hinzufügen</Button>
          </div>
        </section>

        <div className="flex items-start gap-3 rounded-xl border bg-card p-5 shadow-card">
          <Checkbox
            id="selfDecisionConfirm"
            checked={selfDecisionConfirm}
            onCheckedChange={(checked) => setSelfDecisionConfirm(checked === true)}
            className="mt-0.5"
          />
          <Label htmlFor="selfDecisionConfirm" className="text-sm leading-relaxed cursor-pointer">
            Ich bestätige, dass dieser Vorschlag <strong>nicht in meinem eigenen Aufgabenbereich eigenständig umsetzbar</strong> ist und daher als prämienberechtigter Verbesserungsvorschlag eingereicht wird. *
          </Label>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/')}>Abbrechen</Button>
          <Button type="submit" className="gradient-primary text-primary-foreground hover:opacity-90" disabled={submitting}>
            <Send className="mr-2 h-4 w-4" /> {submitting ? 'Wird eingereicht...' : 'Vorschlag einreichen'}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
