export type PremiumClassId = 1 | 2 | 3 | 4;

export interface PremiumClassInfo {
  id: PremiumClassId;
  label: string;
  scope: string;
  /** Urlaubsoption. null bedeutet: in dieser Klasse gibt es ausschließlich eine Geldprämie. */
  urlaub: string | null;
  geld: string;
  options: string;
  hinweis: string;
}

export const PREMIUM_CLASSES: Record<PremiumClassId, PremiumClassInfo> = {
  1: {
    id: 1,
    label: 'Klasse 1 – Arbeitsplatz',
    scope: 'Eigener Arbeitsplatz',
    urlaub: '1 Tag',
    geld: '100 €',
    options: '1 Urlaubstag oder 100 €',
    hinweis: 'Wahlweise 1 Urlaubstag oder 100 € Geldprämie.',
  },
  2: {
    id: 2,
    label: 'Klasse 2 – Abteilung',
    scope: 'Abteilung',
    urlaub: '2 Tage',
    geld: '200 €',
    options: '2 Urlaubstage oder 200 €',
    hinweis: 'Wahlweise 2 Urlaubstage oder 200 € Geldprämie.',
  },
  3: {
    id: 3,
    label: 'Klasse 3 – Organisation',
    scope: 'Gesamte Organisation',
    urlaub: '3 Tage',
    geld: '300 €',
    options: '3 Urlaubstage oder 300 €',
    hinweis: 'Wahlweise 3 Urlaubstage oder 300 € Geldprämie.',
  },
  4: {
    id: 4,
    label: 'Klasse 4 – Finanzielle Prämie',
    scope: 'Messbarer wirtschaftlicher Nutzen',
    urlaub: null,
    geld: 'Individuell',
    options: 'Finanzielle Prämie, Höhe durch Geschäftsführung',
    hinweis: 'Derartige Vorschläge werden finanziell prämiert. Über die Höhe der Prämie entscheidet von Fall zu Fall die Geschäftsführung anhand der jeweils ermittelten Einsparungen.',
  },
};

export const PREMIUM_CLASS_LIST: PremiumClassInfo[] = [1, 2, 3, 4].map(
  id => PREMIUM_CLASSES[id as PremiumClassId]
);

/** Klasse 4 kennt nur die Geldprämie – Urlaubstage sind dort nicht vorgesehen. */
export function isMoneyOnlyClass(premiumClass?: number | null): boolean {
  return premiumClass === 4;
}

export function premiumChoiceOptions(
  premiumClass?: number | null
): ('urlaub' | 'geld')[] {
  return isMoneyOnlyClass(premiumClass) ? ['geld'] : ['urlaub', 'geld'];
}
