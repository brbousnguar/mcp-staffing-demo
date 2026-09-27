/**
 * Serveur MCP de demonstration - staffing d'une ESN.
 *
 * Quatre outils, choisis pour raconter une histoire pendant la presentation :
 *
 *   1. rechercher_collaborateurs  -> un schema type remplace une doc d'API en prose
 *   2. obtenir_collaborateur      -> la fiche detaillee, seulement quand on la demande
 *   3. analyser_staffing_mission  -> le serveur calcule, l'agent ne recoit que la reponse
 *   4. reserver_collaborateur     -> une ecriture qui echoue franchement au lieu de mentir
 *
 * Aucune base, aucun appel reseau : tout est en memoire (src/donnees.ts).
 */

import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';

import {
  CAPACITE_MENSUELLE,
  collaborateurs,
  joursDisponibles,
  missions,
  moisConnus,
  reservations,
  type Collaborateur
} from './donnees.js';

const MOIS = /^\d{4}-(0[1-9]|1[0-2])$/;

const server = new McpServer({
  name: 'staffing-demo',
  version: '1.0.0'
});

const niveauDe = (collab: Collaborateur, competence: string): number =>
  collab.competences.find(c => c.nom === competence)?.niveau ?? 0;

const ligneCollab = (collab: Collaborateur, mois?: string): string => {
  const dispo = mois ? ` | ${joursDisponibles(collab, mois)} j dispo en ${mois}` : '';
  return `${collab.id} ${collab.nom} - ${collab.poste} (${collab.seniorite}, ${collab.agence}) | TJM ${collab.tjm} EUR${dispo}`;
};

const texte = (contenu: string) => ({ content: [{ type: 'text' as const, text: contenu }] });

const erreur = (contenu: string) => ({
  content: [{ type: 'text' as const, text: contenu }],
  isError: true
});

/* -------------------------------------------------------------------------
 * 1. Recherche
 *
 * Le schema est la documentation. L'agent n'a pas a deviner le nom d'un
 * parametre ni le format d'un mois : le serveur refuse ce qui ne colle pas.
 * ---------------------------------------------------------------------- */
server.registerTool(
  'rechercher_collaborateurs',
  {
    title: 'Rechercher des collaborateurs',
    description:
      "Recherche des collaborateurs disponibles selon une competence, une agence et un mois. " +
      "Retourne une liste courte, triee par niveau de competence puis par disponibilite.",
    inputSchema: z.strictObject({
      competence: z
        .string()
        .optional()
        .describe("Competence recherchee, en minuscules (ex. 'react', 'kafka', 'kubernetes')"),
      niveau_min: z
        .number()
        .int()
        .min(1)
        .max(5)
        .optional()
        .describe('Niveau minimum sur cette competence, de 1 a 5'),
      agence: z
        .enum(['Paris', 'Lyon', 'Bordeaux', 'Rabat', 'Barcelone'])
        .optional()
        .describe('Restreindre a une agence'),
      mois: z
        .string()
        .regex(MOIS, 'Format attendu : AAAA-MM')
        .optional()
        .describe("Mois de besoin au format AAAA-MM (ex. '2026-11')"),
      jours_min: z
        .number()
        .int()
        .min(1)
        .max(CAPACITE_MENSUELLE)
        .optional()
        .describe('Nombre minimum de jours disponibles sur le mois demande'),
      limite: z.number().int().min(1).max(20).default(5).describe('Nombre maximum de resultats')
    })
  },
  async ({ competence, niveau_min, agence, mois, jours_min, limite }) => {
    if (jours_min !== undefined && mois === undefined) {
      return erreur("`jours_min` exige `mois` : impossible de calculer une disponibilite sans mois.");
    }
    if (mois && !moisConnus().includes(mois)) {
      return erreur(`Mois '${mois}' hors du referentiel. Mois connus : ${moisConnus().join(', ')}.`);
    }

    const resultats = collaborateurs
      .filter(c => (agence ? c.agence === agence : true))
      .filter(c => (competence ? niveauDe(c, competence) >= (niveau_min ?? 1) : true))
      .filter(c => (mois && jours_min ? joursDisponibles(c, mois) >= jours_min : true))
      .sort((a, b) => {
        const parNiveau = competence ? niveauDe(b, competence) - niveauDe(a, competence) : 0;
        if (parNiveau !== 0) return parNiveau;
        return mois ? joursDisponibles(b, mois) - joursDisponibles(a, mois) : a.tjm - b.tjm;
      })
      .slice(0, limite);

    if (resultats.length === 0) {
      return texte(
        'Aucun collaborateur ne correspond. Elargissez le critere : baissez `niveau_min`, ' +
          'retirez `agence`, ou decalez `mois`.'
      );
    }

    return texte(
      `${resultats.length} resultat(s) :\n` + resultats.map(c => ligneCollab(c, mois)).join('\n')
    );
  }
);

/* -------------------------------------------------------------------------
 * 2. Fiche detaillee
 *
 * La recherche reste courte ; le detail se paie a la demande, sur un seul id.
 * ---------------------------------------------------------------------- */
server.registerTool(
  'obtenir_collaborateur',
  {
    title: 'Obtenir la fiche d un collaborateur',
    description:
      "Fiche detaillee d'un collaborateur : competences notees, TJM, langues et " +
      'disponibilite mois par mois.',
    inputSchema: z.strictObject({
      id: z.string().describe("Identifiant du collaborateur, ex. 'c-001'")
    })
  },
  async ({ id }) => {
    const collab = collaborateurs.find(c => c.id === id);
    if (!collab) {
      return erreur(
        `Aucun collaborateur '${id}'. Utilisez rechercher_collaborateurs pour obtenir un id valide.`
      );
    }

    const competences = collab.competences.map(c => `${c.nom} ${c.niveau}/5`).join(', ');
    const dispo = moisConnus()
      .map(m => `${m}: ${joursDisponibles(collab, m)}/${CAPACITE_MENSUELLE} j`)
      .join(' | ');

    return texte(
      [
        `${collab.nom} (${collab.id})`,
        `${collab.poste} - ${collab.seniorite} - agence ${collab.agence}`,
        `TJM ${collab.tjm} EUR | langues : ${collab.langues.join(', ')}`,
        `Competences : ${competences}`,
        `Disponibilite : ${dispo}`
      ].join('\n')
    );
  }
);

/* -------------------------------------------------------------------------
 * 3. Analyse de staffing
 *
 * Le coeur de la demonstration. Un agent branche sur une API REST brute
 * devrait lister les missions, lister les collaborateurs, croiser les
 * competences et calculer les disponibilites - plusieurs tours, beaucoup de
 * JSON, et une arithmetique laissee au modele. Ici, le serveur fait le
 * travail et ne renvoie que la reponse, plus un objet structure exploitable.
 * ---------------------------------------------------------------------- */
server.registerTool(
  'analyser_staffing_mission',
  {
    title: 'Analyser le staffing d une mission',
    description:
      "Evalue quels collaborateurs peuvent couvrir une mission : score d'adequation, " +
      'ecarts de competences, cout estime et alerte budget. Une seule reponse, deja calculee.',
    inputSchema: z.strictObject({
      mission_id: z.string().describe("Identifiant de la mission, ex. 'm-101'"),
      candidats_max: z.number().int().min(1).max(10).default(3)
    }),
    outputSchema: z.object({
      mission_id: z.string(),
      mois_analyse: z.string(),
      etp_requis: z.number(),
      etp_couvert: z.number(),
      candidats: z.array(
        z.object({
          id: z.string(),
          nom: z.string(),
          score: z.number(),
          jours_disponibles: z.number(),
          competences_manquantes: z.array(z.string()),
          hors_budget: z.boolean()
        })
      )
    })
  },
  async ({ mission_id, candidats_max }) => {
    const mission = missions.find(m => m.id === mission_id);
    if (!mission) {
      return erreur(
        `Mission '${mission_id}' inconnue. Missions disponibles : ${missions.map(m => m.id).join(', ')}.`
      );
    }

    const mois = mission.debut;
    const evalues = collaborateurs
      .map(collab => {
        const manquantes = mission.competencesRequises
          .filter(req => niveauDe(collab, req.nom) < req.niveauMin)
          .map(req => `${req.nom} (${niveauDe(collab, req.nom)}/${req.niveauMin} requis)`);

        const couvertes = mission.competencesRequises.length - manquantes.length;
        const partCompetences = couvertes / mission.competencesRequises.length;
        const jours = joursDisponibles(collab, mois);
        const partDispo = jours / CAPACITE_MENSUELLE;
        const bonusAgence = collab.agence === mission.agence ? 0.1 : 0;

        return {
          id: collab.id,
          nom: collab.nom,
          score: Math.round((partCompetences * 0.6 + partDispo * 0.3 + bonusAgence) * 100),
          jours_disponibles: jours,
          competences_manquantes: manquantes,
          hors_budget: collab.tjm > mission.budgetTjmMax,
          tjm: collab.tjm
        };
      })
      .filter(c => c.jours_disponibles > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, candidats_max);

    const etpCouvert =
      Math.round(
        (evalues.reduce((t, c) => t + c.jours_disponibles, 0) / CAPACITE_MENSUELLE) * 10
      ) / 10;

    const structuredContent = {
      mission_id: mission.id,
      mois_analyse: mois,
      etp_requis: mission.etpRequis,
      etp_couvert: etpCouvert,
      candidats: evalues.map(({ tjm: _tjm, ...reste }) => reste)
    };

    const lignes = evalues.map(c => {
      const manque = c.competences_manquantes.length
        ? ` | manque : ${c.competences_manquantes.join(', ')}`
        : ' | toutes competences couvertes';
      const budget = c.hors_budget ? ` | HORS BUDGET (${c.tjm} > ${mission.budgetTjmMax} EUR)` : '';
      return `  ${c.score}/100  ${c.nom} (${c.id}) - ${c.jours_disponibles} j dispo${manque}${budget}`;
    });

    const verdict =
      etpCouvert >= mission.etpRequis
        ? `Couverture suffisante : ${etpCouvert} ETP disponibles pour ${mission.etpRequis} requis.`
        : `Deficit de ${Math.round((mission.etpRequis - etpCouvert) * 10) / 10} ETP : ` +
          `${etpCouvert} disponibles pour ${mission.etpRequis} requis.`;

    return {
      content: [
        {
          type: 'text' as const,
          text: [
            `${mission.intitule} - ${mission.client} (${mission.id})`,
            `Demarrage ${mission.debut}, ${mission.dureeMois} mois, agence ${mission.agence}, TJM max ${mission.budgetTjmMax} EUR`,
            '',
            verdict,
            '',
            'Meilleurs candidats :',
            ...lignes
          ].join('\n')
        }
      ],
      structuredContent
    };
  }
);

/* -------------------------------------------------------------------------
 * 4. Reservation
 *
 * L'ecriture. La regle qui compte : si l'appel ne fait pas ce qu'il annonce,
 * il doit echouer bruyamment. Un `succes: true` qui ne change rien envoie
 * l'agent en boucle - il "reussit", constate que rien n'a bouge, recommence.
 * ---------------------------------------------------------------------- */
server.registerTool(
  'reserver_collaborateur',
  {
    title: 'Reserver un collaborateur sur une mission',
    description:
      "Pose une reservation de jours sur un collaborateur pour un mois donne. " +
      'Echoue explicitement si le collaborateur, la mission ou la capacite ne suivent pas.',
    inputSchema: z.strictObject({
      collaborateur_id: z.string().describe("Identifiant du collaborateur, ex. 'c-003'"),
      mission_id: z.string().describe("Identifiant de la mission, ex. 'm-101'"),
      mois: z.string().regex(MOIS, 'Format attendu : AAAA-MM'),
      jours: z.number().int().min(1).max(CAPACITE_MENSUELLE).describe('Jours ouvres a reserver')
    })
  },
  async ({ collaborateur_id, mission_id, mois, jours }) => {
    const collab = collaborateurs.find(c => c.id === collaborateur_id);
    if (!collab) return erreur(`Collaborateur '${collaborateur_id}' inconnu. Aucune reservation posee.`);

    const mission = missions.find(m => m.id === mission_id);
    if (!mission) return erreur(`Mission '${mission_id}' inconnue. Aucune reservation posee.`);

    const dispo = joursDisponibles(collab, mois);
    if (dispo === 0) {
      return erreur(
        `${collab.nom} n'a aucune disponibilite en ${mois}. Aucune reservation posee. ` +
          `Mois ouverts : ${moisConnus().join(', ')}.`
      );
    }
    if (jours > dispo) {
      return erreur(
        `Capacite insuffisante : ${jours} j demandes, ${dispo} j disponibles pour ${collab.nom} ` +
          `en ${mois}. Aucune reservation posee.`
      );
    }

    const reservation = {
      id: `r-${String(reservations.length + 1).padStart(3, '0')}`,
      collaborateurId: collab.id,
      missionId: mission.id,
      mois,
      jours,
      creeLe: new Date().toISOString()
    };
    reservations.push(reservation);

    return texte(
      `Reservation ${reservation.id} posee : ${collab.nom}, ${jours} j en ${mois} sur ` +
        `${mission.intitule} (${mission.id}). Reste ${joursDisponibles(collab, mois)} j disponibles.`
    );
  }
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[staffing-demo] serveur MCP demarre sur stdio');
}

main().catch(err => {
  console.error('[staffing-demo] echec au demarrage :', err);
  process.exit(1);
});
