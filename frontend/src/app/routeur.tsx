import { Navigate, createBrowserRouter } from "react-router-dom";
import { RouteProtegee } from "@/features/auth/components/RouteProtegee";
import { RouteOnboarding } from "@/features/auth/components/RouteOnboarding";
import { RouteDejaOnboarde } from "@/features/auth/components/RouteDejaOnboarde";
import { MiseEnPagePublique } from "@/layouts/MiseEnPagePublique";
import { MiseEnPagePrivee } from "@/layouts/MiseEnPagePrivee";
import PageAccueil from "@/features/accueil/pages/PageAccueil";
import PageActivation from "@/features/auth/pages/PageActivation";
import PageConnexion from "@/features/auth/pages/PageConnexion";
import PageInscription from "@/features/auth/pages/PageInscription";
import PageMotDePasseOublie from "@/features/auth/pages/PageMotDePasseOublie";
import PageReinitialisation from "@/features/auth/pages/PageReinitialisation";
import PageMonCompte from "@/features/compte/pages/PageMonCompte";
import PageExplorer from "@/features/explorer/pages/PageExplorer";
import PageResultats from "@/features/rechercheVols/pages/PageResultats";
import PageDetailVol from "@/features/rechercheVols/pages/PageDetailVol";
import PageComparateur from "@/features/comparateur/pages/PageComparateur";
import PageOnboarding from "@/features/preferences/pages/PageOnboarding";

/**
 * Table de routage : associe une adresse (URL) à la page à afficher.
 *
 * Deux mises en page :
 * - MiseEnPagePublique : accueil, formulaires d'authentification, et /onboarding ;
 * - MiseEnPagePrivee   : l'espace connecté (onglets, avatar, déconnexion).
 *
 * Un objet sans "path" ne crée pas d'adresse : il « enveloppe » ses enfants
 * (une mise en page ou une garde), qui s'affichent dans son <Outlet />.
 */
export const routeur = createBrowserRouter([
  // ===== Mise en page publique =====
  {
    element: <MiseEnPagePublique />,
    children: [
      // ----- Pages publiques -----
      { path: "/", element: <PageAccueil /> },
      { path: "/inscription", element: <PageInscription /> },
      { path: "/connexion", element: <PageConnexion /> },
      { path: "/activation", element: <PageActivation /> },
      { path: "/mot-de-passe-oublie", element: <PageMotDePasseOublie /> },
      { path: "/reinitialisation", element: <PageReinitialisation /> },

      // ----- Page protégée, mais avec l'en-tête public -----
      {
        element: <RouteProtegee />,
        children: [
          {
            element: <RouteDejaOnboarde />,
            children: [{ path: "/onboarding", element: <PageOnboarding /> }],
          },
        ],
      },

      // "*" attrape toute adresse inconnue et renvoie vers l'accueil.
      // "replace" remplace l'entrée de l'historique : le bouton Retour ne boucle pas.
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },

  // ===== Espace connecté =====
  // La garde est À L'EXTÉRIEUR de la mise en page : une personne non connectée
  // est redirigée avant que l'en-tête privé ne s'affiche.
  {
    element: <RouteProtegee />,
    children: [
      {
        element: <RouteOnboarding />,
        children: [
          {
            element: <MiseEnPagePrivee />,
            children: [
              { path: "/explorer", element: <PageExplorer /> },
              // Résultats : les critères arrivent dans l'URL (?origine=…&destination=…)
              { path: "/resultats", element: <PageResultats /> },
              // Détail d'un vol : ":id" est un paramètre (lu avec useParams si besoin)
              { path: "/vol/:id", element: <PageDetailVol /> },
              { path: "/comparateur", element: <PageComparateur /> },
              // 🆕 Repris de complete-front
              { path: "/mon-compte", element: <PageMonCompte /> },
            ],
          },
        ],
      },
    ],
  },
]);