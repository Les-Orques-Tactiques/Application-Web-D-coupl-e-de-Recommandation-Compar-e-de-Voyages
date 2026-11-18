import { Navigate, createBrowserRouter } from "react-router-dom";
import { RouteProtegee } from "@/features/auth/components/RouteProtegee";
import { MiseEnPagePublique } from "@/layouts/MiseEnPagePublique";
import { MiseEnPagePrivee } from "@/layouts/MiseEnPagePrivee";
import PageAccueil from "@/features/accueil/pages/PageAccueil";
import PageActivation from "@/features/auth/pages/PageActivation";
import PageConnexion from "@/features/auth/pages/PageConnexion";
import PageInscription from "@/features/auth/pages/PageInscription";
import PageMotDePasseOublie from "@/features/auth/pages/PageMotDePasseOublie";
import PageReinitialisation from "@/features/auth/pages/PageReinitialisation";
import PageExplorer from "@/features/explorer/pages/PageExplorer";
import PageBienvenue from "@/features/preferences/pages/PageBienvenue";
import PageComparateur  from "@/features/comparateur/pages/PageComparateur";


/**
 * Table de routage : associe une adresse (URL) à la page à afficher.
 *
 * Deux mises en page :
 * - MiseEnPagePublique : accueil, formulaires d'authentification, et /bienvenue ;
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
      // /bienvenue (onboarding) n'a pas besoin des onglets Explorer / Favoris…
      {
        element: <RouteProtegee />,
        children: [
          // FormulaireConnexion redirige ici si l'onboarding n'est pas terminé
          { path: "/bienvenue", element: <PageBienvenue /> },
        ],
      },

      // "*" attrape toute adresse inconnue et renvoie vers l'accueil.
      // "replace" remplace l'entrée de l'historique : le bouton Retour ne boucle pas.
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },

  // ===== Espace connecté =====
  // L'ordre compte : la garde est À L'EXTÉRIEUR de la mise en page.
  // Une personne non connectée est donc redirigée avant que l'en-tête privé
  // ne s'affiche (pas d'avatar « ?? » qui clignote).
  {
    element: <RouteProtegee />,
    children: [
      {
        element: <MiseEnPagePrivee />,
        children: [
          // Les onglets passent par l'URL : /explorer?onglet=favoris, ?onglet=historique…
          { path: "/explorer", element: <PageExplorer /> },
          // Les futures pages privées viendront ici (ex. /profil, /comparateur)
          { path: "/comparateur", element: <PageComparateur /> },
        ],
      },
    ],
  },
]);
