import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Search, CheckCircle2, PiggyBank, Trophy, ArrowRight, PlusCircle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/StatCard';
import SuggestionCard from '@/components/SuggestionCard';
import { mockSuggestions, mockStats } from '@/lib/mockData';

export default function Dashboard() {
  const topSuggestions = mockSuggestions.filter((s) => s.status === 'umgesetzt' || s.status === 'angenommen').slice(0, 3);
  const recentSuggestions = [...mockSuggestions].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl gradient-hero p-6 md:p-10 text-primary-foreground"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-5 w-5 text-accent" />
              <span className="text-sm font-medium text-primary-foreground/70">Betriebliches Vorschlagswesen</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">Ihre Ideen machen den Unterschied!</h1>
            <p className="mt-2 text-primary-foreground/70 max-w-lg">
              Bringen Sie Verbesserungsvorschläge ein und gestalten Sie die Zukunft der Handwerkskammer Berlin aktiv mit.
            </p>
          </div>
          <Link to="/einreichen">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shadow-elevated">
              <PlusCircle className="mr-2 h-5 w-5" />
              Vorschlag einreichen
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Eingereicht" value={mockStats.totalSubmitted} icon={FileText} description="Vorschläge gesamt" variant="primary" />
        <StatCard title="In Prüfung" value={mockStats.inReview} icon={Search} description="Werden aktuell bewertet" />
        <StatCard title="Umgesetzt" value={mockStats.implemented} icon={CheckCircle2} description="Erfolgreich realisiert" variant="success" />
        <StatCard title="Eingespart" value={mockStats.savedResources} icon={PiggyBank} description="Geschätzte Einsparungen" variant="accent" />
      </div>

      {/* Best ideas */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-bold">Beste Ideen des Jahres</h2>
          </div>
          <Link to="/vorschlaege" className="text-sm text-primary hover:underline flex items-center gap-1">
            Alle anzeigen <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-3">
          {topSuggestions.map((s, i) => (
            <SuggestionCard key={s.id} suggestion={s} index={i} />
          ))}
        </div>
      </section>

      {/* Recent */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Neueste Vorschläge</h2>
          <Link to="/vorschlaege" className="text-sm text-primary hover:underline flex items-center gap-1">
            Alle anzeigen <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-3">
          {recentSuggestions.map((s, i) => (
            <SuggestionCard key={s.id} suggestion={s} index={i} />
          ))}
        </div>
      </section>

      {/* Premium classes info */}
      <section className="rounded-xl border bg-card p-6 shadow-card">
        <h2 className="text-lg font-bold mb-4">Prämienklassen</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { klasse: 1, scope: 'Eigener Arbeitsplatz', urlaub: '1 Tag', geld: '100 €' },
            { klasse: 2, scope: 'Abteilung', urlaub: '2 Tage', geld: '200 €' },
            { klasse: 3, scope: 'Gesamte Organisation', urlaub: '3 Tage', geld: '300 €' },
            { klasse: 4, scope: 'Messbarer wirtschaftl. Nutzen', urlaub: 'Individuell', geld: 'Individuell' },
          ].map((p) => (
            <div key={p.klasse} className="rounded-lg border bg-muted/50 p-4 text-center">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Klasse {p.klasse}</div>
              <p className="mt-1 text-sm font-medium">{p.scope}</p>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <p>🏖️ {p.urlaub} Urlaub</p>
                <p>💰 {p.geld}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
