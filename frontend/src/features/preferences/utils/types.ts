/**
 * Types du module Préférences.
 *
 * Deux familles de types :
 * - ChoixPreferences : la saisie du formulaire (noms en français, côté front) ;
 * - Preferences, PreferencesModifiables, LieuDepart : recopiés de PreferenceSchema.py
 *   (noms en snake_case, ceux du back).
 *
 * Correspondance Python → TypeScript :
 *   Optional[str]   → string | null
 *   float / int     → number
 *   UUID            → string (JSON ne connaît que du texte)
 *   datetime        → string (date au format ISO, ex. "2026-11-18T14:32:00")
 */

// Limites du back, recopiées pour valider côté front avant l'envoi
export const ESCALES_MAX_AUTORISE = 5;
export const MAX_COMPAGNIES = 20;

// ---------------------------------------------------------------------------
// Côté formulaire
// ---------------------------------------------------------------------------

/** Les options proposées par ChoixTrajet. À adapter si ton ancien type en avait d'autres. */
export type Trajet = "direct" | "une escale" | "indifferent";

/** Ce que la personne saisit dans FormulairePreferences (converti avant l'envoi). */
export interface ChoixPreferences {
  aeroport: string; // "" si rien n'est saisi
  budget: number | null; // null = sans limite
  trajet: Trajet;
  compagnies: string[]; // [] si rien n'est saisi
}

// ---------------------------------------------------------------------------
// Côté API (PreferenceSchema.py)
// ---------------------------------------------------------------------------

/** Ce que renvoie le back pour toutes les routes (schéma PreferencesOut). */
export interface Preferences {
  utilisateur_id: string;
  aeroport_habituel: string | null; // code IATA en majuscules, ex. "LYS"
  budget_max: number | null; // arrondi à 2 décimales par le back
  escales_max: number | null; // de 0 à 5
  compagnies_preferees: string[]; // jamais null en sortie : [] par défaut
  latitude_depart: number | null;
  longitude_depart: number | null;
  a_un_lieu_depart: boolean;
  modifie_le: string | null; // à convertir avec new Date(...) pour l'affichage
}

/**
 * Corps accepté par PATCH et par POST /onboarding (schéma _PreferencesBase).
 * - champ absent → pas modifié ;
 * - champ à null → effacé.
 * Écrit à la main (et non avec Omit<Preferences, ...>), car le back utilise extra="forbid" :
 * utilisateur_id, a_un_lieu_depart, modifie_le ou latitude_depart provoqueraient une erreur 422.
 */
export interface PreferencesModifiables {
  aeroport_habituel?: string | null; // exactement 3 lettres
  budget_max?: number | null; // >= 0
  escales_max?: number | null; // de 0 à ESCALES_MAX_AUTORISE
  compagnies_preferees?: string[] | null; // MAX_COMPAGNIES au maximum
}

/** Corps de PUT /lieu-depart (schéma LieuDepartUpdate) : les deux champs sont obligatoires. */
export interface LieuDepart {
  latitude: number; // de -90 à 90
  longitude: number; // de -180 à 180
}
