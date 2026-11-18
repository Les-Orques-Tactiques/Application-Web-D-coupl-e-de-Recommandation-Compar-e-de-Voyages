// RouteOnboarding.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexte/useAuth";

export function RouteOnboarding() {
  const { utilisateur, chargement } = useAuth();
  const emplacement = useLocation();

  if (chargement) {
    return <p className="p-8 text-center text-attenue">Chargement…</p>;
  }

  if (!utilisateur) {
    return <Navigate to="/connexion" replace />;
  }

  if (!utilisateur.onboarding_termine) {
    return (
      <Navigate
        to="/onboarding"
        replace
        state={{ depuis: emplacement.pathname + emplacement.search }}
      />
    );
  }

  return <Outlet />;
}