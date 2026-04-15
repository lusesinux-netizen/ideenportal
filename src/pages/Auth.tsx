import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lightbulb, Mail, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Auth() {
  const { user, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const ALLOWED_DOMAIN = '@hwk-berlin.de';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
      toast.error('Nur E-Mail-Adressen mit @hwk-berlin.de sind zugelassen.');
      return;
    }

    setSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Erfolgreich angemeldet!');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success('Konto erstellt! Bitte bestätigen Sie Ihre E-Mail.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Ein Fehler ist aufgetreten.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary mx-auto mb-4">
            <Lightbulb className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Ideenportal</h1>
          <p className="text-sm text-muted-foreground mt-1">Handwerkskammer Berlin</p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-card">
          <h2 className="text-lg font-semibold mb-4">
            {isLogin ? 'Anmelden' : 'Konto erstellen'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ihr vollständiger Name" className="pl-10" required />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@hwk-berlin.de" className="pl-10" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pl-10" required minLength={6} />
              </div>
            </div>

            <Button type="submit" className="w-full gradient-primary text-primary-foreground hover:opacity-90" disabled={submitting}>
              {submitting ? 'Bitte warten...' : isLogin ? 'Anmelden' : 'Registrieren'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin ? 'Noch kein Konto? Jetzt registrieren' : 'Bereits registriert? Anmelden'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
