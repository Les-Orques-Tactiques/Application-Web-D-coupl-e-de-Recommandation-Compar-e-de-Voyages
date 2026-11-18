import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexte/useAuth";

export function RouteProtegee() {
  const { utilisateur, chargement } = useAuth();
  const emplacement = useLocation();

  // Indispensable : sans cette attente, rafraîchir la page (F5) renverrait
  // vers /connexion avant que /moi ait répondu
  if (chargement) {
    return <p className="p-8 text-center text-attenue">Chargement…</p>;
  }

  if (!utilisateur) {
    // On mémorise la page demandée pour y revenir après la connexion
    return <Navigate to="/connexion" replace state={{ depuis: emplacement.pathname + emplacement.search }} />;
  }

  return <Outlet />; // affiche la page enfant
}
