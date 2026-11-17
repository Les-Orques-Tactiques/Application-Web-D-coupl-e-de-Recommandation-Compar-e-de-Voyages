// "Porte d'entrée" de la feature d'authentification : les autres dossiers du projet
// n'importent que ce qui est listé ici (jamais un fichier interne directement).
export { FormulaireInscription } from "./components/FormulaireInscription";
export { FormulaireConnexion } from "./components/FormulaireConnexion";
export { CarteActivation } from "./components/CarteActivation";
export { useActivation } from "./hooks/useActivation";
export { emailEnAttente } from "./stockage";
