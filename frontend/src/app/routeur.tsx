import { Navigate, createBrowserRouter } from "react-router-dom";
import { RouteProtegee } from "@/features/auth/components/RouteProtegee";
import { MiseEnPagePublique } from "@/layouts/MiseEnPagePublique";
import PageActivation from "@/pages/PageActivation";
import PageConnexion from "@/pages/PageConnexion";
import PageInscription from "@/pages/PageInscription";
import PageMotDePasseOublie from "@/pages/PageMotDePasseOublie";
import PageReinitialisation from "@/pages/PageReinitialisation";

/**
 * Table de routage : associe une adresse (URL) à la page à afficher.
 *
 * Les pages listées dans "children" sont affichées à l'intérieur de MiseEnPagePublique
 * (à l'endroit de son <Outlet />), donc elles partagent le même en-tête et pied de page.
 */
export const routeur = createBrowserRouter([
  {
    element: <MiseEnPagePublique />,
    children: [
      // ----- Pages publiques -----
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
          // Provisoire : l'espace connecté aura plus tard sa propre mise en page
          { path: "/explorer", element: <p className="p-16">Connecté ✔ (page Explorer à venir)</p> },
          // Provisoire aussi : FormulaireConnexion redirige ici si l'onboarding n'est pas terminé
          { path: "/bienvenue", element: <p className="p-16">Bienvenue ! (choix des préférences à venir)</p> },
        ],
      },

      // "*" attrape toute adresse inconnue et renvoie vers la connexion.
      // "replace" remplace l'entrée de l'historique : le bouton Retour ne boucle pas.
      { path: "*", element: <Navigate to="/connexion" replace /> },
    ],
  },
]);
