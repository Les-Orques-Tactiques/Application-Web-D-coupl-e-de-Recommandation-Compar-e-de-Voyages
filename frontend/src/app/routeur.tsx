import { Navigate, createBrowserRouter } from "react-router-dom";
import { RouteProtegee } from "@/features/auth/components/RouteProtegee";
import { MiseEnPagePublique } from "@/layouts/MiseEnPagePublique";
import PageAccueil from "@/features/accueil/pages/PageAccueil";
import PageActivation from "@/features/auth/pages/PageActivation";
import PageConnexion from "@/features/auth/pages/PageConnexion";
import PageInscription from "@/features/auth/pages/PageInscription";
import PageMotDePasseOublie from "@/features/auth/pages/PageMotDePasseOublie";
import PageReinitialisation from "@/features/auth/pages/PageReinitialisation";
import PageBienvenue from "@/features/preferences/pages/PageBienvenue";
import PageExplorer from "@/features/auth/pages/PageExplorer";

/**
 * Table de routage : associe une adresse (URL) à la page à afficher.
 *
 * Les pages publiques partagent MiseEnPagePublique. L'espace Explorer garde son propre en-tête.
 */
export const routeur = createBrowserRouter([
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

      // ----- Pages réservées aux personnes connectées -----
      // Pas de "path" : RouteProtegee sert seulement de garde.
      // Si /moi a répondu 401, elle redirige vers /connexion. Sinon, son <Outlet />
      // affiche la page enfant.
      {
        element: <RouteProtegee />,
        children: [
          // FormulaireConnexion redirige ici si l'onboarding n'est pas terminé
          { path: "/bienvenue", element: <PageBienvenue /> },
        ],
      },

      // "*" attrape toute adresse inconnue et renvoie vers la connexion.
      // "replace" remplace l'entrée de l'historique : le bouton Retour ne boucle pas.
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
  {
    element: <RouteProtegee />,
    children: [{ path: "/explorer", element: <PageExplorer /> }],
  },
  // "*" attrape toute adresse inconnue et renvoie vers la connexion.
  { path: "*", element: <Navigate to="/connexion" replace /> },
]);
