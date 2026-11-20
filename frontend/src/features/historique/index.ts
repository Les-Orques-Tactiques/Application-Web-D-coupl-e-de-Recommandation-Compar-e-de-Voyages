// Point d'entrée de la feature : les autres dossiers importent depuis "@/features/historique"
export { BandeauAfficherPlus } from "./components/BandeauAfficherPlus";
export { CarteRecherche } from "./components/CarteRecherche";
export { EnTeteHistorique } from "./components/EnTeteHistorique";
export { GroupeJour } from "./components/GroupeJour";
export { useHistorique } from "./hooks/useHistorique";
export { criteresDepuisHistorique } from "./utils/criteres";
export { grouperParJour, type GroupeDeRecherches } from "./utils/dates";