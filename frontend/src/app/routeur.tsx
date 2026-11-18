import { Navigate, createBrowserRouter } from "react-router-dom";
import { RouteProtegee } from "@/features/auth/components/RouteProtegee";
import { MiseEnPagePublique } from "@/layouts/MiseEnPagePublique";
import PageAccueil from "@/features/accueil/pages/PageAccueil";
import PageActivation from "@/features/auth/pages/PageActivation";
import PageConnexion from "@/features/auth/pages/PageConnexion";
import PageInscription from "@/features/auth/pages/PageInscription";
import PageMotDePasseOublie from "@/features/auth/pages/PageMotDePasseOublie";
import PageReinitialisation from "@/features/auth/pages/PageReinitialisation";
import { PageComparateur } from "@/features/comparateur/PageComparateur";

/**
 * Table de routage : associe une adresse (URL) à la page à afficher.
 *
 * Les pages listées dans "children" sont affichées à l'intérieur de MiseEnPagePublique
 * (à l'endroit de son <Outlet />), donc elles partagent le même en-tête et pied de page.
 */
export const routeur = createBrowserRouter([
  // ----- Page autonome avec sa propre barre de navigation démo -----
 

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
      { path: "/comparateur", element: <PageComparateur /> },

      // ----- Pages réservées aux personnes connectées -----
      {
        element: <RouteProtegee />,
        children: [
          { path: "/explorer", element: <p className="p-16">Connecté ✔ (page Explorer à venir)</p> },
          { path: "/bienvenue", element: <p className="p-16">Bienvenue ! (choix des préférences à venir)</p> },
        ],
      },

      // "*" attrape toute adresse inconnue et renvoie vers l'accueil.
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
