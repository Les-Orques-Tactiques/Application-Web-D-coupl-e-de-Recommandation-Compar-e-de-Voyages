# Orca Flight : frontend (pages d’authentification)

React 19 + Vite + TypeScript + Tailwind CSS v4 + React Router. Code écrit avec des noms en français.

## Démarrer

```bash
npm install
cp .env.example .env     # VITE_MOCK_API=true : fonctionne sans backend
npm run dev              # http://localhost:5173
```

Pages : `/inscription`, `/connexion`, `/activation`.

## Tester sans backend (VITE_MOCK_API=true)

- Inscription : un formulaire valide mène à `/activation`.
- Connexion : un mot de passe d’au moins 12 caractères réussit, sinon le bandeau d’erreur s’affiche.
- Activation : `/activation?jeton=ok` (succès), `?jeton=expire` (lien expiré), tout autre jeton (invalide).

## Passer au vrai backend Flask

Mettre `VITE_MOCK_API=false`. Le proxy Vite redirige `/api` vers `http://localhost:5000`.
Les clés JSON échangées avec le backend restent en anglais (contrat d’API).

| Méthode | Route | Corps | Réponses |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | `first_name, last_name, email, password, consents{terms, personalization, geolocation}` | 201 ; 409 e-mail déjà utilisé |
| POST | `/api/auth/login` | `email, password` | 200 ; 401 identifiants ; 403 compte non activé |
| POST | `/api/auth/activate` | `token` | 200 ; 410 expiré ; 400 invalide |
| POST | `/api/auth/resend-activation` | `email` | 200 |

Erreurs : `{ "message": "...", "code": "..." }`. Le lien envoyé par e-mail doit pointer vers `/activation?jeton=XXXX`.

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
