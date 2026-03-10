
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('mitarbeitend', 'jury', 'geschaeftsfuehrung');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Jury and GF can view all roles
CREATE POLICY "Jury can view all roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'jury') OR public.has_role(auth.uid(), 'geschaeftsfuehrung'));

-- Create suggestions table
CREATE TABLE public.suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  problem_description TEXT NOT NULL,
  solution_description TEXT NOT NULL,
  expected_benefit TEXT NOT NULL,
  category TEXT NOT NULL,
  scope TEXT NOT NULL,
  estimated_savings TEXT,
  feasibility TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'eingereicht',
  premium_class INT,
  premium_choice TEXT,
  jury_comment TEXT,
  submitted_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view suggestions" ON public.suggestions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own suggestions" ON public.suggestions FOR INSERT TO authenticated WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "Users can update own pending suggestions" ON public.suggestions FOR UPDATE TO authenticated
  USING (auth.uid() = submitted_by AND status = 'eingereicht');
CREATE POLICY "Jury can update suggestions" ON public.suggestions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'jury'));
CREATE POLICY "GF can update suggestions" ON public.suggestions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'geschaeftsfuehrung'));

-- Create team_members table
CREATE TABLE public.suggestion_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id UUID NOT NULL REFERENCES public.suggestions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL
);

ALTER TABLE public.suggestion_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view team members" ON public.suggestion_team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert team members for own suggestions" ON public.suggestion_team_members FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.suggestions WHERE id = suggestion_id AND submitted_by = auth.uid()));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_suggestions_updated_at BEFORE UPDATE ON public.suggestions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile and default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email), NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'mitarbeitend');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
