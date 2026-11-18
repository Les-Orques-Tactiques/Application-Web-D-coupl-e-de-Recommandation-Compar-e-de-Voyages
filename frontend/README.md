# Orca Flight : frontend (pages d’authentification)

React 19 + Vite + TypeScript + Tailwind CSS v4 + React Router. Code écrit avec des noms en français.

## Démarrer

```bash
npm install
cp .env.example .env
npm run dev              # http://localhost:5173
```

Pages : `/inscription`, `/connexion`, `/activation` et `/explorer` (réservée aux personnes connectées).

## Tester sans backend (VITE_MOCK_API=true)

- Inscription : un formulaire valide mène à `/activation`.
- Connexion : un mot de passe d’au moins 12 caractères réussit, sinon le bandeau d’erreur s’affiche.
- Activation : `/activation?jeton=ok` (succès), `?jeton=expire` (lien expiré), tout autre jeton (invalide).

## Connexion au backend FastAPI

Le proxy Vite redirige `/api` vers `http://localhost:8000`. Configurez et démarrez la base PostgreSQL et le backend à partir des fichiers `.env.example` et `docker-compose.yml` à la racine du projet. Les appels API du frontend utilisent les cookies de session et le jeton CSRF.

| Méthode | Route | Corps | Réponses |
| --- | --- | --- | --- |
| POST | `/api/exploration/recherches` | critères du trajet | Vols du catalogue et enregistrement de l’historique |
| GET | `/api/exploration/favoris` | — | Favoris du compte |
| POST / DELETE | `/api/exploration/favoris/{vol_id}` | — | Ajout / retrait d’un favori |
| GET | `/api/exploration/historique` | — | Recherches enregistrées du compte |

Les résultats proviennent des tables `vols`, `aeroports`, `recherches` et `favoris`. Les données de vols doivent être présentes dans le catalogue pour qu’une recherche retourne des offres.

## Glossaire des noms

| Français | Rôle |
| --- | --- |
| `appelerApi`, `ErreurApi` | Appel HTTP vers Flask, erreur avec `statut` |
| `creerCompte`, `seConnecter`, `activerCompte`, `renvoyerEmailActivation` | Appels d’authentification |
| `FormulaireInscription`, `FormulaireConnexion`, `CarteActivation` | Composants de la feature |
| `Bouton`, `Champ`, `CaseACocher`, `Bandeau`, `SurTitre` | Composants d’interface |
| `MiseEnPagePublique` | En-tête et pied de page des pages publiques |
| `--color-principal`, `--color-profond`, `--color-citron`… | Couleurs (`src/index.css`) |

## Lire le code

Chaque fonction est commentée en français, avec une explication des notions utilisées (useState, useEffect, async/await, types TypeScript…). Ordre de lecture conseillé :
1. `src/lib/clientApi.ts` puis `src/features/auth/api.ts` : comment on parle au serveur ;
2. `src/features/auth/hooks/useActivation.ts` : un hook simple ;
3. `src/features/auth/components/FormulaireConnexion.tsx` puis `FormulaireInscription.tsx` : état, validation, envoi ;
4. `src/components/ui/` : composants réutilisables ;
5. `src/pages/` et `src/app/routeur.tsx` : l'assemblage des pages.

## À faire

- Remplacer `public/images/hublot.jpg` (extrait basse définition de la maquette) par la photo d’origine.
- Remplacer le logo SVG approximatif de `Logo.tsx` par le fichier officiel.
- Vérifier la couleur d’erreur `--color-erreur` (estimée).
- Pages mot de passe oublié / nouveau mot de passe, puis espace connecté.
