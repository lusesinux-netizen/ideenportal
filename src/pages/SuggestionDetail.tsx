import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Users, Tag, MapPin, MessageSquare, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';
import { useQuery } from '@tanstack/react-query';
import { fetchSuggestionById } from '@/lib/supabase-helpers';

const scopeLabels: Record<string, string> = {
  arbeitsplatz: 'Eigener Arbeitsplatz',
  abteilung: 'Abteilung',
  kammer: 'Gesamte Kammer',
};

const premiumLabels: Record<number, { urlaub: string; geld: string }> = {
  1: { urlaub: '1 Urlaubstag', geld: '100 €' },
  2: { urlaub: '2 Urlaubstage', geld: '200 €' },
  3: { urlaub: '3 Urlaubstage', geld: '300 €' },
  4: { urlaub: 'Individuell', geld: 'Individuell' },
};

export default function SuggestionDetail() {
  const { id } = useParams();
  const { data: s, isLoading, error } = useQuery({
    queryKey: ['suggestion', id],
    queryFn: () => fetchSuggestionById(id!),
    enabled: !!id,
  });

  if (isLoading) return <div className="text-center py-20 text-muted-foreground">Laden...</div>;
  if (error || !s) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Vorschlag nicht gefunden.</p>
        <Link to="/vorschlaege"><Button variant="link" className="mt-4">Zurück zur Übersicht</Button></Link>
      </div>
    );
  }

  const teamMembers = s.suggestion_team_members || [];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6">
      <Link to="/vorschlaege"><Button variant="ghost" size="sm" className="text-muted-foreground"><ArrowLeft className="mr-2 h-4 w-4" /> Zurück</Button></Link>

      <div className="rounded-xl border bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <StatusBadge status={s.status} />
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Tag className="h-3.5 w-3.5" /> {s.category}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {scopeLabels[s.scope] || s.scope}</span>
        </div>
        <h1 className="text-2xl font-bold">{s.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Eingereicht am {new Date(s.created_at).toLocaleDateString('de-DE')}</span>
          {teamMembers.length > 0 && <span className="flex items-center gap-1"><Users className="h-4 w-4" /> Teamvorschlag</span>}
        </div>
      </div>

      <div className="space-y-4">
        <section className="rounded-xl border bg-card p-6 shadow-card"><h2 className="font-semibold mb-2">Problembeschreibung</h2><p className="text-sm text-muted-foreground leading-relaxed">{s.problem_description}</p></section>
        <section className="rounded-xl border bg-card p-6 shadow-card"><h2 className="font-semibold mb-2">Lösungsvorschlag</h2><p className="text-sm text-muted-foreground leading-relaxed">{s.solution_description}</p></section>
        <section className="rounded-xl border bg-card p-6 shadow-card"><h2 className="font-semibold mb-2">Erwarteter Nutzen</h2><p className="text-sm text-muted-foreground leading-relaxed">{s.expected_benefit}</p></section>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <section className="rounded-xl border bg-card p-6 shadow-card"><h2 className="font-semibold mb-2">Realisierbarkeit</h2><p className="text-sm text-muted-foreground">{s.feasibility}</p></section>
          {s.estimated_savings && <section className="rounded-xl border bg-card p-6 shadow-card"><h2 className="font-semibold mb-2">Geschätzte Einsparungen</h2><p className="text-sm font-semibold text-success">{s.estimated_savings}</p></section>}
        </div>
      </div>

      {teamMembers.length > 0 && (
        <section className="rounded-xl border bg-card p-6 shadow-card">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4" /> Teammitglieder</h2>
          <div className="space-y-2">
            {teamMembers.map(m => (
              <div key={m.id} className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2">
                <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">{m.name.split(' ').map(n => n[0]).join('')}</div>
                <div><p className="text-sm font-medium">{m.name}</p><p className="text-xs text-muted-foreground">{m.email}</p></div>
              </div>
            ))}
          </div>
        </section>
      )}

      {s.jury_comment && (
        <section className="rounded-xl border border-primary/20 bg-primary/5 p-6">
          <h2 className="font-semibold mb-2 flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Rückmeldung der Jury</h2>
          <p className="text-sm text-foreground leading-relaxed">{s.jury_comment}</p>
        </section>
      )}

      {s.premium_class && (
        <section className="rounded-xl border border-accent/30 bg-accent/5 p-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><Award className="h-4 w-4 text-accent" /> Prämierung – Klasse {s.premium_class}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg border bg-card p-3 text-center"><p className="text-muted-foreground text-xs">Urlaub</p><p className="font-semibold mt-1">{premiumLabels[s.premium_class]?.urlaub}</p></div>
            <div className="rounded-lg border bg-card p-3 text-center"><p className="text-muted-foreground text-xs">Geldprämie</p><p className="font-semibold mt-1">{premiumLabels[s.premium_class]?.geld}</p></div>
          </div>
          {s.premium_choice && <p className="mt-3 text-sm text-muted-foreground">Gewählte Prämie: <span className="font-medium text-foreground">{s.premium_choice === 'urlaub' ? '🏖️ Urlaub' : '💰 Geldprämie'}</span></p>}
        </section>
      )}
    </motion.div>
  );
}
