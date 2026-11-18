// Point d'entrée de la feature : le reste de l'application importe depuis "@/features/resultats"
export { default as PageResultats } from "./pages/PageResultats";
export { useResultats } from "./hooks/useResultats";
export { useFiltres } from "./hooks/useFiltres";
export type { Vol, Filtres, Tri, Avis, SaisieRecherche } from "./utils/types";
