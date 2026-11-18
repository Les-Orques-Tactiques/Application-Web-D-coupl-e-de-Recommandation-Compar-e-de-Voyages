import type { Trajet } from "./types";

// Texte affiché pour chaque valeur de trajet, partagé par ChoixTrajet et CarteBoussole
export const libellesTrajet: Record<Trajet, string> = {
  direct: "Direct de préférence",
  "une escale": "1 escale acceptée",
  indifferent: "Indifférent",
};
