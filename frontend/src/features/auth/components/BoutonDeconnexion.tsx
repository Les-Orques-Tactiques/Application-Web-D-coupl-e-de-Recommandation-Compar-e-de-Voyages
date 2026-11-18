import { useState } from "react";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Bouton } from "@/components/ui/Bouton";
import { useAuth } from "../contexte/useAuth";

//type des props
type Props = {
  /** "moyenne" par défaut pour ne rien casser là où le bouton est déjà utilisé */
  taille?: "moyenne" | "petite";
};

//on récupère la prop (valeur par défaut "moyenne")
export function BoutonDeconnexion({ taille = "moyenne" }: Props) {
  const { deconnecter } = useAuth();
  const naviguerVers = useNavigate();
  const [enCours, setEnCours] = useState(false);

  async function cliquer() {
    setEnCours(true);
    await deconnecter(); // ne lève jamais d'erreur (voir le catch du fournisseur)
    naviguerVers("/connexion", { replace: true });
  }

  return (
    //On transmet la taille au Bouton
    <Bouton type="button" taille={taille} onClick={cliquer} disabled={enCours}>
      <LogOut aria-hidden="true" className="size-4" />
      {enCours ? "Déconnexion…" : "Se déconnecter"}
    </Bouton>
  );
}
