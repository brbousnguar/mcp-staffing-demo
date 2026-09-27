# mcp-staffing-demo — staffing d'une ESN

*[English](README.md)*

Le serveur MCP de démonstration de la présentation
[« MCP — donner des mains à vos agents »](https://heybrahim.com/talks/mcp/).

Quatre outils, un jeu de données en mémoire, aucune dépendance externe à l'exécution.

## Démarrage

```bash
npm install
npm run build
claude mcp add staffing -- node "$PWD/dist/index.js"
```

Pour les autres clients, voir la section « Connecting » du [README anglais](README.md#connecting).

## Les outils

| Outil | Entrées | Sortie |
|---|---|---|
| `rechercher_collaborateurs` | `competence?`, `niveau_min?`, `agence?`, `mois?`, `jours_min?`, `limite` | Liste courte, triée par niveau puis disponibilité |
| `obtenir_collaborateur` | `id` | Fiche détaillée : compétences notées, TJM, langues, charge mensuelle |
| `analyser_staffing_mission` | `mission_id`, `candidats_max` | Verdict de couverture + candidats scorés, avec `structuredContent` typé |
| `reserver_collaborateur` | `collaborateur_id`, `mission_id`, `mois`, `jours` | Confirmation de réservation, ou erreur explicite |

## Ce que le code démontre

Chaque outil existe pour illustrer un point précis de la présentation :

- **`z.strictObject` partout.** Un paramètre inventé par le modèle est rejeté avec
  `Unrecognized key: "…"`, au lieu d'être ignoré en silence — la cause du bug raconté en leçon 1.
- **Le calcul vit dans le serveur.** `analyser_staffing_mission` croise compétences, charge et
  budget en TypeScript testé. Le modèle reçoit un verdict, pas des tables à recouper.
- **Deux sorties pour un appel.** `content` porte la réponse lisible par le modèle,
  `structuredContent` le même résultat en JSON typé pour le code qui orchestre.
- **Aucun succès vide.** `reserver_collaborateur` échoue franchement si le collaborateur est
  inconnu ou la capacité insuffisante. Un agent ne peut pas croire avoir écrit sans avoir écrit.

## Scripts

| Commande | Effet |
|---|---|
| `npm run build` | Compile `src/` vers `dist/` |
| `npm run dev` | Compile en continu |
| `npm run check` | Vérification de types seule |
| `npm start` | Lance le serveur sur stdio |

## Le jeu de données

`src/donnees.ts` — 8 collaborateurs, 3 missions, une capacité de 20 jours ouvrés par mois,
quatre mois ouverts (`2026-09` à `2026-12`). Tout est fictif.

Les réservations posées pendant une session vivent en mémoire et disparaissent au redémarrage.

## Pile

TypeScript 5.9 · `@modelcontextprotocol/server` 2.0 · Zod 4 · transport stdio · Node ≥ 20

> **Attention à la version du SDK.** Ce serveur utilise le SDK **v2**
> (`@modelcontextprotocol/server`, import de `zod/v4`, `inputSchema` sous forme de
> `z.strictObject({…})`). La plupart des tutoriels en ligne utilisent encore le SDK **v1**
> (`@modelcontextprotocol/sdk`), dont les chemins d'import et la forme de `inputSchema`
> — une *raw shape* plutôt qu'un objet Zod — diffèrent. Copier ce code dans un projet v1
> ne fonctionnera pas tel quel.
