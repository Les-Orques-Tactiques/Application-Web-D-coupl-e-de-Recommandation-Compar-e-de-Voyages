import { useSearchParams } from "react-router-dom";

// Doit correspondre aux liens ?onglet=… de MiseEnPagePrivee
const ONGLETS = ["explorer", "favoris", "historique", "comparateur"] as const;
export type Onglet = (typeof ONGLETS)[number];

/**
 * Onglet actif lu dans l'adresse : /explorer?onglet=favoris → "favoris".
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