import { useState } from "react";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Bouton } from "@/components/ui/Bouton";
import { useAuth } from "../contexte/useAuth";

export function BoutonDeconnexion() {
  const { deconnecter } = useAuth();
  const naviguerVers = useNavigate();
  const [enCours, setEnCours] = useState(false);

  async function cliquer() {
    setEnCours(true);
    await deconnecter(); // ne lève jamais d'erreur (voir le catch du fournisseur)
    naviguerVers("/connexion", { replace: true });
  }

  return (
    <Bouton type="button" onClick={cliquer} disabled={enCours}>
      <LogOut aria-hidden="true" className="size-4" />
      {enCours ? "Déconnexion…" : "Se déconnecter"}
    </Bouton>
  );
}
