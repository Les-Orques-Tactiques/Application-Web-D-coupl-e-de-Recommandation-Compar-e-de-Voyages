// Porte d'entrée de la feature préférences, sur le même principe que features/auth/index.ts
export { FormulairePreferences } from "./components/FormulairePreferences";
export { lirePreferences, modifierPreferences } from "./services/preferenceServices";
export type { Preferences, PreferencesModifiables, Trajet } from "./utils/types"; 
