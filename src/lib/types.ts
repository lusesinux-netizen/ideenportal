export type SuggestionStatus = 'eingereicht' | 'in_pruefung' | 'angenommen' | 'abgelehnt' | 'umgesetzt';

export type Category =
  | 'Dienstleistungsqualität'
  | 'Prozesse / Verwaltung'
  | 'Personal / Organisation'
  | 'Arbeitsbedingungen'
  | 'Umwelt / Nachhaltigkeit'
  | 'Arbeitssicherheit'
  | 'Kosten- oder Ressourceneinsparung';

export type Scope = 'arbeitsplatz' | 'abteilung' | 'kammer';

export type PremiumClass = 1 | 2 | 3 | 4;

export type PremiumChoice = 'urlaub' | 'geld';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
}

export interface Suggestion {
  id: string;
  title: string;
  problemDescription: string;
  solutionDescription: string;
  expectedBenefit: string;
  category: Category;
  scope: Scope;
  estimatedSavings?: string;
  feasibility: string;
  teamMembers: TeamMember[];
  attachments: string[];
  status: SuggestionStatus;
  premiumClass?: PremiumClass;
  premiumChoice?: PremiumChoice;
  juryComment?: string;
  submittedBy: string;
  submittedAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalSubmitted: number;
  inReview: number;
  implemented: number;
  savedResources: string;
}
