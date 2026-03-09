import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronDown, ChevronUp, Calendar, Tag, MapPin, Users, Send, Award, AlertTriangle, CheckCircle2, XCircle, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/StatusBadge';
import { mockSuggestions } from '@/lib/mockData';
import { Suggestion, SuggestionStatus, PremiumClass } from '@/lib/types';
import { toast } from 'sonner';

const scopeLabels = {
  arbeitsplatz: 'Eigener Arbeitsplatz',
  abteilung: 'Abteilung',
  kammer: 'Gesamte Kammer',
};

const statusActions: { value: SuggestionStatus; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'eingereicht', label: 'Eingereicht', icon: FileText, description: 'Noch nicht bearbeitet' },
  { value: 'in_pruefung', label: 'In Prüfung', icon: Clock, description: 'Wird aktuell geprüft' },
  { value: 'angenommen', label: 'Angenommen', icon: CheckCircle2, description: 'Zur Umsetzung freigegeben' },
  { value: 'abgelehnt', label: 'Abgelehnt', icon: XCircle, description: 'Nicht zur Umsetzung' },
  { value: 'umgesetzt', label: 'Umgesetzt', icon: CheckCircle2, description: 'Erfolgreich realisiert' },
];

const premiumOptions: { value: string; label: string; description: string }[] = [
  { value: '1', label: 'Klasse 1', description: 'Arbeitsplatz – 1 Tag / 100 €' },
  { value: '2', label: 'Klasse 2', description: 'Abteilung – 2 Tage / 200 €' },
  { value: '3', label: 'Klasse 3', description: 'Organisation – 3 Tage / 300 €' },
  { value: '4', label: 'Klasse 4', description: 'Individuell (Geschäftsführung)' },
];

function JuryReviewCard({ suggestion: initial }: { suggestion: Suggestion }) {
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState(initial.juryComment || '');
  const [status, setStatus] = useState<SuggestionStatus>(initial.status);
  const [premiumClass, setPremiumClass] = useState<string>(initial.premiumClass?.toString() || '');
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success(`Bewertung für "${initial.title}" gespeichert`, {
        description: `Status: ${statusActions.find(s => s.value === status)?.label} ${premiumClass ? `| Klasse ${premiumClass}` : ''}`,
      });
    }, 600);
  };

  const daysSinceSubmission = Math.floor((Date.now() - new Date(initial.submittedAt).getTime()) / (1000 * 60 * 60 * 24));
  const needsInterimNotice = daysSinceSubmission > 42 && (status === 'eingereicht' || status === 'in_pruefung');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card shadow-card overflow-hidden"
    >
      {/* Header row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-4 p-5 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <StatusBadge status={status} />
            <span className="text-xs text-muted-foreground">{initial.category}</span>
            {needsInterimNotice && (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 border border-warning/20 px-2 py-0.5 text-xs font-semibold text-warning">
                <AlertTriangle className="h-3 w-3" /> Zwischenbescheid nötig
              </span>
            )}
          </div>
          <h3 className="font-semibold text-card-foreground">{initial.title}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(initial.submittedAt).toLocaleDateString('de-DE')}</span>
            <span>{initial.submittedBy}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{scopeLabels[initial.scope]}</span>
            {initial.teamMembers.length > 0 && (
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />+{initial.teamMembers.length}</span>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />}
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t px-5 pb-5 pt-4 space-y-5">
              {/* Read-only details */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Problem</p>
                  <p className="text-sm leading-relaxed">{initial.problemDescription}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lösung</p>
                  <p className="text-sm leading-relaxed">{initial.solutionDescription}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Erwarteter Nutzen</p>
                  <p className="text-sm leading-relaxed">{initial.expectedBenefit}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Realisierbarkeit</p>
                  <p className="text-sm leading-relaxed">{initial.feasibility}</p>
                </div>
                {initial.estimatedSavings && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Geschätzte Einsparungen</p>
                    <p className="text-sm font-semibold text-success">{initial.estimatedSavings}</p>
                  </div>
                )}
              </div>

              {/* Warning banner for interim notice */}
              {needsInterimNotice && (
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Zwischenbescheid erforderlich</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Dieser Vorschlag wurde vor {daysSinceSubmission} Tagen eingereicht. Nach 6 Wochen ohne Entscheidung muss ein Zwischenbescheid an die einreichende Person gesendet werden.
                    </p>
                    <Button size="sm" variant="outline" className="mt-2 border-warning/30 text-warning hover:bg-warning/10"
                      onClick={(e) => { e.stopPropagation(); toast.success('Zwischenbescheid wurde versendet.'); }}
                    >
                      <Send className="mr-2 h-3.5 w-3.5" /> Zwischenbescheid senden
                    </Button>
                  </div>
                </div>
              )}

              {/* Jury actions */}
              <div className="rounded-lg border bg-muted/30 p-5 space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" /> Jury-Bewertung
                </h4>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Status ändern</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as SuggestionStatus)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusActions.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            <div className="flex items-center gap-2">
                              <s.icon className="h-3.5 w-3.5" />
                              <span>{s.label}</span>
                              <span className="text-muted-foreground text-xs ml-1">– {s.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Prämienklasse</Label>
                    <Select value={premiumClass} onValueChange={setPremiumClass}>
                      <SelectTrigger>
                        <SelectValue placeholder="Klasse wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {premiumOptions.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            <div className="flex items-center gap-2">
                              <Award className="h-3.5 w-3.5" />
                              <span>{p.label}</span>
                              <span className="text-muted-foreground text-xs ml-1">– {p.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`comment-${initial.id}`}>Kommentar / Begründung</Label>
                  <Textarea
                    id={`comment-${initial.id}`}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Schreiben Sie Ihre Bewertung und Begründung..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" size="sm" onClick={() => setExpanded(false)}>Abbrechen</Button>
                  <Button size="sm" className="gradient-primary text-primary-foreground hover:opacity-90" onClick={handleSave} disabled={saving}>
                    {saving ? 'Speichern...' : 'Bewertung speichern'}
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

export default function JuryView() {
  const [filter, setFilter] = useState('offen');

  const filtered = mockSuggestions.filter((s) => {
    if (filter === 'offen') return s.status === 'eingereicht' || s.status === 'in_pruefung';
    if (filter === 'entschieden') return s.status === 'angenommen' || s.status === 'abgelehnt' || s.status === 'umgesetzt';
    return true;
  });

  const openCount = mockSuggestions.filter(s => s.status === 'eingereicht' || s.status === 'in_pruefung').length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" /> Jury-Bewertung
          </h1>
          <p className="mt-1 text-muted-foreground">{openCount} Vorschläge warten auf Bewertung</p>
        </div>

        <div className="flex rounded-lg border bg-muted/50 p-1">
          {[
            { value: 'offen', label: `Offen (${openCount})` },
            { value: 'entschieden', label: 'Entschieden' },
            { value: 'alle', label: 'Alle' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === tab.value ? 'bg-card shadow-card text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Eingereicht', count: mockSuggestions.filter(s => s.status === 'eingereicht').length, color: 'text-info' },
          { label: 'In Prüfung', count: mockSuggestions.filter(s => s.status === 'in_pruefung').length, color: 'text-warning' },
          { label: 'Angenommen', count: mockSuggestions.filter(s => s.status === 'angenommen').length, color: 'text-success' },
          { label: 'Abgelehnt', count: mockSuggestions.filter(s => s.status === 'abgelehnt').length, color: 'text-destructive' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-card p-3 text-center shadow-card">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Suggestion list */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((s) => <JuryReviewCard key={s.id} suggestion={s} />)
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Shield className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Keine Vorschläge in dieser Kategorie.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
