import { Navigate, createBrowserRouter } from "react-router-dom";
import { MiseEnPagePublique } from "@/layouts/MiseEnPagePublique";
import PageActivation from "@/pages/PageActivation";
import PageConnexion from "@/pages/PageConnexion";
import PageInscription from "@/pages/PageInscription";

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
      { path: "/inscription", element: <PageInscription /> },
      { path: "/connexion", element: <PageConnexion /> },
      { path: "/activation", element: <PageActivation /> },
      // Provisoire : l'espace connecté sera ajouté avec la mise en page de l'application
      { path: "/explorer", element: <p className="p-16">Connecté ✔ (page Explorer à venir)</p> },
      // "*" attrape toute adresse inconnue et renvoie vers la connexion.
      // "replace" remplace l'entrée de l'historique : le bouton Retour ne boucle pas.
      { path: "*", element: <Navigate to="/connexion" replace /> },
    ],
  },
]);
