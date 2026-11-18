import { appelerApi } from "@/lib/clientApi";
import type { LieuDepart, Preferences, PreferencesModifiables } from "../utils/types";

// Préfixe du contrôleur, précédé de "/api" comme dans api.ts.
// Toutes ces routes exigent d'être connecté : sinon, ErreurApi 401.
const URL_PREFERENCES = "/api/utilisateurs/moi/preferences";

// Rappel : appelerApi fait lui-même le JSON.stringify de "corps" : on passe toujours un objet.

/** Lit les préférences de la personne connectée. 429 si trop de requêtes (30/min). */
export const lirePreferences = () => appelerApi<Preferences>(URL_PREFERENCES);

/**
 * Modifie une partie des préférences et renvoie les préférences à jour.
 * - champ absent → pas modifié ; champ à null → effacé.
 * - Attention : undefined est retiré par JSON.stringify, il compte donc comme ABSENT.
 *
 * N'envoie que les champs modifiés, jamais l'objet Preferences complet
 * (extra="forbid" côté back → 422).
 *
 * Erreurs : 400 (aéroport inconnu), 422 (valeur refusée ou objet vide), 429 (20/min).
 */
export async function modifierPreferences(modifications: PreferencesModifiables): Promise<Preferences> {
  // Le back refuse un corps vide (« Au moins un champ à modifier est requis »).
  // Au lieu d'une erreur 422 inutile, on relit simplement les préférences.
  if (Object.values(modifications).every((valeur) => valeur === undefined)) {
    return lirePreferences();
  }
  return appelerApi<Preferences>(URL_PREFERENCES, { methode: "PATCH", corps: modifications });
}

/**
 * Enregistre les choix de la première connexion (page /bienvenue).
 * Que le formulaire soit rempli ou passé, le back met onboarding_termine à TRUE.
 * Erreurs : 400 (aéroport inconnu), 422, 429 (10/min).
 */
export async function enregistrerOnboarding(choix: PreferencesModifiables = {}): Promise<Preferences> {
  return appelerApi<Preferences>(`${URL_PREFERENCES}/onboarding`, { methode: "POST", corps: choix });
}

/** Bouton « Passer » de l'onboarding : un corps vide est accepté ici (contrairement au PATCH). */
export const passerOnboarding = () => enregistrerOnboarding({});

/**
 * Enregistre la position de départ (par exemple, celle obtenue avec navigator.geolocation).
 * 403 si la personne n'a pas donné son consentement « localisation ».
 * 422 si la latitude ou la longitude sort des limites.
 */
export async function definirLieuDepart(lieu: LieuDepart): Promise<Preferences> {
  return appelerApi<Preferences>(`${URL_PREFERENCES}/lieu-depart`, {
    methode: "PUT",
    corps: { latitude: lieu.latitude, longitude: lieu.longitude },
  });
}

/** Efface la position de départ enregistrée (DELETE, sans corps). */
export const supprimerLieuDepart = () =>
  appelerApi<Preferences>(`${URL_PREFERENCES}/lieu-depart`, { methode: "DELETE" });
