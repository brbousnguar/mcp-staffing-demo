/**
 * Jeu de donnees en memoire : un mini-referentiel de staffing d'ESN.
 *
 * Volontairement en dur, sans base ni appel reseau : une demo qui tourne
 * en salle de conference ne doit dependre de rien.
 */

export type Collaborateur = {
  id: string;
  nom: string;
  agence: 'Paris' | 'Lyon' | 'Bordeaux' | 'Rabat' | 'Barcelone';
  poste: string;
  seniorite: 'junior' | 'confirme' | 'senior' | 'expert';
  competences: { nom: string; niveau: 1 | 2 | 3 | 4 | 5 }[];
  tjm: number;
  /** Jours ouvres deja vendus, par mois ISO. Capacite pleine = 20 j/mois. */
  chargeParMois: Record<string, number>;
  langues: string[];
};

export type Mission = {
  id: string;
  client: string;
  intitule: string;
  agence: Collaborateur['agence'];
  debut: string;
  dureeMois: number;
  competencesRequises: { nom: string; niveauMin: 1 | 2 | 3 | 4 | 5 }[];
  etpRequis: number;
  budgetTjmMax: number;
};

export type Reservation = {
  id: string;
  collaborateurId: string;
  missionId: string;
  mois: string;
  jours: number;
  creeLe: string;
};

export const CAPACITE_MENSUELLE = 20;

export const collaborateurs: Collaborateur[] = [
  {
    id: 'c-001',
    nom: 'Amina Berrada',
    agence: 'Rabat',
    poste: 'Developpeuse back-end',
    seniorite: 'senior',
    competences: [
      { nom: 'java', niveau: 5 },
      { nom: 'spring-boot', niveau: 5 },
      { nom: 'kafka', niveau: 3 },
      { nom: 'postgresql', niveau: 4 }
    ],
    tjm: 520,
    chargeParMois: { '2026-09': 20, '2026-10': 12, '2026-11': 0, '2026-12': 0 },
    langues: ['fr', 'ar', 'en']
  },
  {
    id: 'c-002',
    nom: 'Thomas Lefevre',
    agence: 'Paris',
    poste: 'Architecte integration',
    seniorite: 'expert',
    competences: [
      { nom: 'mulesoft', niveau: 5 },
      { nom: 'api-design', niveau: 5 },
      { nom: 'java', niveau: 4 },
      { nom: 'kafka', niveau: 4 }
    ],
    tjm: 780,
    chargeParMois: { '2026-09': 20, '2026-10': 20, '2026-11': 10, '2026-12': 5 },
    langues: ['fr', 'en']
  },
  {
    id: 'c-003',
    nom: 'Clara Nunes',
    agence: 'Barcelone',
    poste: 'Developpeuse front-end',
    seniorite: 'confirme',
    competences: [
      { nom: 'react', niveau: 4 },
      { nom: 'typescript', niveau: 4 },
      { nom: 'accessibilite', niveau: 3 },
      { nom: 'design-system', niveau: 3 }
    ],
    tjm: 460,
    chargeParMois: { '2026-09': 8, '2026-10': 0, '2026-11': 0, '2026-12': 0 },
    langues: ['es', 'en', 'fr']
  },
  {
    id: 'c-004',
    nom: 'Yanis Cherif',
    agence: 'Lyon',
    poste: 'Data engineer',
    seniorite: 'confirme',
    competences: [
      { nom: 'python', niveau: 4 },
      { nom: 'spark', niveau: 4 },
      { nom: 'postgresql', niveau: 3 },
      { nom: 'dbt', niveau: 3 }
    ],
    tjm: 500,
    chargeParMois: { '2026-09': 20, '2026-10': 20, '2026-11': 20, '2026-12': 15 },
    langues: ['fr', 'en']
  },
  {
    id: 'c-005',
    nom: 'Sophie Marchand',
    agence: 'Paris',
    poste: 'Developpeuse full-stack',
    seniorite: 'senior',
    competences: [
      { nom: 'typescript', niveau: 5 },
      { nom: 'react', niveau: 4 },
      { nom: 'node', niveau: 5 },
      { nom: 'postgresql', niveau: 3 }
    ],
    tjm: 610,
    chargeParMois: { '2026-09': 15, '2026-10': 5, '2026-11': 0, '2026-12': 0 },
    langues: ['fr', 'en']
  },
  {
    id: 'c-006',
    nom: 'Karim Ouali',
    agence: 'Bordeaux',
    poste: 'Ingenieur DevOps',
    seniorite: 'senior',
    competences: [
      { nom: 'kubernetes', niveau: 5 },
      { nom: 'terraform', niveau: 4 },
      { nom: 'azure', niveau: 4 },
      { nom: 'observabilite', niveau: 4 }
    ],
    tjm: 590,
    chargeParMois: { '2026-09': 18, '2026-10': 10, '2026-11': 10, '2026-12': 0 },
    langues: ['fr', 'en']
  },
  {
    id: 'c-007',
    nom: 'Leila Haddad',
    agence: 'Rabat',
    poste: 'Developpeuse front-end',
    seniorite: 'junior',
    competences: [
      { nom: 'react', niveau: 3 },
      { nom: 'typescript', niveau: 2 },
      { nom: 'accessibilite', niveau: 2 }
    ],
    tjm: 320,
    chargeParMois: { '2026-09': 0, '2026-10': 0, '2026-11': 0, '2026-12': 0 },
    langues: ['fr', 'ar', 'en']
  },
  {
    id: 'c-008',
    nom: 'Marc Delaunay',
    agence: 'Paris',
    poste: 'Tech lead',
    seniorite: 'expert',
    competences: [
      { nom: 'typescript', niveau: 5 },
      { nom: 'node', niveau: 5 },
      { nom: 'api-design', niveau: 4 },
      { nom: 'kubernetes', niveau: 3 }
    ],
    tjm: 820,
    chargeParMois: { '2026-09': 20, '2026-10': 20, '2026-11': 20, '2026-12': 20 },
    langues: ['fr', 'en']
  }
];

export const missions: Mission[] = [
  {
    id: 'm-101',
    client: 'Assureur regional',
    intitule: 'Refonte du portail souscription',
    agence: 'Paris',
    debut: '2026-11',
    dureeMois: 6,
    competencesRequises: [
      { nom: 'typescript', niveauMin: 4 },
      { nom: 'react', niveauMin: 4 },
      { nom: 'node', niveauMin: 4 }
    ],
    etpRequis: 2,
    budgetTjmMax: 650
  },
  {
    id: 'm-102',
    client: 'Distributeur specialise',
    intitule: 'Plateforme d integration temps reel',
    agence: 'Paris',
    debut: '2026-11',
    dureeMois: 9,
    competencesRequises: [
      { nom: 'kafka', niveauMin: 3 },
      { nom: 'java', niveauMin: 4 },
      { nom: 'api-design', niveauMin: 4 }
    ],
    etpRequis: 3,
    budgetTjmMax: 700
  },
  {
    id: 'm-103',
    client: 'Groupe industriel',
    intitule: 'Socle Kubernetes multi-cloud',
    agence: 'Bordeaux',
    debut: '2026-12',
    dureeMois: 4,
    competencesRequises: [
      { nom: 'kubernetes', niveauMin: 4 },
      { nom: 'terraform', niveauMin: 4 }
    ],
    etpRequis: 1,
    budgetTjmMax: 620
  }
];

/** Ecritures de la session en cours. Une demo ne persiste rien. */
export const reservations: Reservation[] = [];

export function joursDisponibles(collab: Collaborateur, mois: string): number {
  const vendus = collab.chargeParMois[mois];
  if (vendus === undefined) return 0;
  const reserve = reservations
    .filter(r => r.collaborateurId === collab.id && r.mois === mois)
    .reduce((total, r) => total + r.jours, 0);
  return Math.max(0, CAPACITE_MENSUELLE - vendus - reserve);
}

export function moisConnus(): string[] {
  const vus = new Set<string>();
  for (const c of collaborateurs) for (const m of Object.keys(c.chargeParMois)) vus.add(m);
  return [...vus].sort();
}
