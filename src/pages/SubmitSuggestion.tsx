import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusCircle, X, Upload, Send, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Category, Scope, TeamMember } from '@/lib/types';

const categories: Category[] = [
  'Dienstleistungsqualität',
  'Prozesse / Verwaltung',
  'Personal / Organisation',
  'Arbeitsbedingungen',
  'Umwelt / Nachhaltigkeit',
  'Arbeitssicherheit',
  'Kosten- oder Ressourceneinsparung',
];

const scopes: { value: Scope; label: string }[] = [
  { value: 'arbeitsplatz', label: 'Eigener Arbeitsplatz' },
  { value: 'abteilung', label: 'Abteilung' },
  { value: 'kammer', label: 'Gesamte Kammer' },
];

export default function SubmitSuggestion() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [benefit, setBenefit] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [scope, setScope] = useState<Scope | ''>('');
  const [savings, setSavings] = useState('');
  const [feasibility, setFeasibility] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const addTeamMember = () => {
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;
    setTeamMembers([...teamMembers, { id: crypto.randomUUID(), name: newMemberName, email: newMemberEmail }]);
    setNewMemberName('');
    setNewMemberEmail('');
  };

  const removeTeamMember = (id: string) => {
    setTeamMembers(teamMembers.filter((m) => m.id !== id));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !problem || !solution || !benefit || !category || !scope || !feasibility) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }
    toast.success('Ihr Vorschlag wurde erfolgreich eingereicht!', {
      description: 'Sie erhalten eine Benachrichtigung, sobald die Jury Ihren Vorschlag bewertet hat.',
    });
    navigate('/vorschlaege');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Verbesserungsvorschlag einreichen</h1>
        <p className="mt-1 text-muted-foreground">Teilen Sie Ihre Idee und helfen Sie, die Handwerkskammer Berlin besser zu machen.</p>
      </div>

      {/* Rules info */}
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
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General info */}
        <section className="rounded-xl border bg-card p-6 shadow-card space-y-5">
          <h2 className="font-semibold text-lg">Allgemeine Informationen</h2>

          <div className="space-y-2">
            <Label htmlFor="title">Titel des Vorschlags *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Kurzer, aussagekräftiger Titel" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="problem">Beschreibung des Problems *</Label>
            <Textarea id="problem" value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="Beschreiben Sie die aktuelle Situation und das Problem..." rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="solution">Beschreibung der Lösung *</Label>
            <Textarea id="solution" value={solution} onChange={(e) => setSolution(e.target.value)} placeholder="Beschreiben Sie Ihren konkreten Lösungsvorschlag..." rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="benefit">Erwarteter Nutzen *</Label>
            <Textarea id="benefit" value={benefit} onChange={(e) => setBenefit(e.target.value)} placeholder="Welchen Nutzen erwarten Sie von der Umsetzung?" rows={2} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kategorie *</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Betrifft *</Label>
              <Select value={scope} onValueChange={(v) => setScope(v as Scope)}>
                <SelectTrigger>
                  <SelectValue placeholder="Auswirkungsbereich" />
                </SelectTrigger>
                <SelectContent>
                  {scopes.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Additional info */}
        <section className="rounded-xl border bg-card p-6 shadow-card space-y-5">
          <h2 className="font-semibold text-lg">Weitere Angaben</h2>

          <div className="space-y-2">
            <Label htmlFor="savings">Geschätzte Einsparungen (optional)</Label>
            <Input id="savings" value={savings} onChange={(e) => setSavings(e.target.value)} placeholder="z. B. 5.000 € pro Jahr" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feasibility">Realisierbarkeit *</Label>
            <Textarea id="feasibility" value={feasibility} onChange={(e) => setFeasibility(e.target.value)} placeholder="Wie schätzen Sie die Umsetzbarkeit ein?" rows={2} />
          </div>
        </section>

        {/* Team */}
        <section className="rounded-xl border bg-card p-6 shadow-card space-y-5">
          <h2 className="font-semibold text-lg">Teamvorschlag</h2>
          <p className="text-sm text-muted-foreground">Optional: Fügen Sie Teammitglieder hinzu, die an diesem Vorschlag beteiligt sind.</p>

          {teamMembers.length > 0 && (
            <div className="space-y-2">
              {teamMembers.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-lg border bg-muted/50 px-3 py-2">
                  <span className="text-sm font-medium flex-1">{m.name}</span>
                  <span className="text-xs text-muted-foreground">{m.email}</span>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeTeamMember(m.id)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Input placeholder="Name" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} />
            <Input placeholder="E-Mail" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} />
            <Button type="button" variant="secondary" onClick={addTeamMember} className="shrink-0">
              <PlusCircle className="mr-2 h-4 w-4" /> Hinzufügen
            </Button>
          </div>
        </section>

        {/* File upload */}
        <section className="rounded-xl border bg-card p-6 shadow-card space-y-5">
          <h2 className="font-semibold text-lg">Anhänge</h2>
          <p className="text-sm text-muted-foreground">Laden Sie Skizzen, Dokumente oder Bilder hoch.</p>

          <label className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/20 p-6 cursor-pointer hover:border-primary/40 transition-colors">
            <Upload className="h-8 w-8 text-muted-foreground/40" />
            <span className="text-sm text-muted-foreground">Dateien hier ablegen oder klicken</span>
            <input type="file" multiple className="hidden" onChange={handleFileChange} />
          </label>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border bg-muted/50 px-3 py-2 text-sm">
                  <span className="flex-1 truncate">{f.name}</span>
                  <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFile(i)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/')}>Abbrechen</Button>
          <Button type="submit" className="gradient-primary text-primary-foreground hover:opacity-90">
            <Send className="mr-2 h-4 w-4" /> Vorschlag einreichen
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
