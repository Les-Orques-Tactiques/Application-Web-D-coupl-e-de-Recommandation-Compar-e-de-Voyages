// RouteDejaOnboarde.tsx — autour de la page /onboarding uniquement
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexte/useAuth";

export function RouteDejaOnboarde() {
  const { utilisateur, chargement } = useAuth();

  if (chargement) {
    return <p className="p-8 text-center text-attenue">Chargement…</p>;
  }

  if (utilisateur?.onboarding_termine) {
    return <Navigate to="/explorer" replace />;
  }

  return <Outlet />;
}