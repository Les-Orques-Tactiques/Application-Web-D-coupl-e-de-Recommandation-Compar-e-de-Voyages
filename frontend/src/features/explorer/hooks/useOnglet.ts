import { useSearchParams } from "react-router-dom";

// Les favoris ont leur propre route ; ces onglets restent dans Explorer.
const ONGLETS = ["explorer", "historique", "comparateur"] as const;
export type Onglet = (typeof ONGLETS)[number];

/**
 * Onglet actif lu dans l'adresse, par exemple /explorer?onglet=historique.
 * Sans paramètre (ou avec une valeur inconnue) → "explorer".
 * Avantage : un F5 ou le bouton Retour gardent le bon onglet.
 */
export function useOnglet() {
  const [parametres, setParametres] = useSearchParams();
  const valeur = parametres.get("onglet");
  const onglet: Onglet = ONGLETS.includes(valeur as Onglet) ? (valeur as Onglet) : "explorer";

  function changerOnglet(nouvelOnglet: Onglet) {
    setParametres(nouvelOnglet === "explorer" ? {} : { onglet: nouvelOnglet });
  }

  return { onglet, changerOnglet };
}