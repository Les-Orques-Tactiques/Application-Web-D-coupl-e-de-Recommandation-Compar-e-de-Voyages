// src/features/auth/erreurs.ts
import { ErreurApi } from "@/lib/clientApi";

export type ContexteAuth = "connexion" | "inscription" | "renvoi";

export function messagePourErreur(erreur: unknown, contexte: ContexteAuth): string {
  // fetch a échoué avant d'avoir une réponse : serveur éteint, pas de réseau
  // (une erreur CORS arrive aussi ici en dev)
  if (!(erreur instanceof ErreurApi)) {
    return "Impossible de contacter le serveur. Vérifiez votre connexion puis réessayez.";
  }

  // Cas communs à tous les formulaires
  if (erreur.statut === 429) {
    return "Trop de tentatives. Patientez une minute avant de réessayer.";
  }
  if (erreur.statut >= 500) {
    return "Le service est momentanément indisponible. Réessayez dans quelques instants.";
  }

  // Cas propres à chaque formulaire
  switch (contexte) {
    case "connexion":
      if (erreur.statut === 401) {
        return "Email ou mot de passe incorrect, ou compte pas encore activé.";
      }
      break;
    case "inscription":
      if (erreur.statut === 409) return "Un compte existe déjà avec cette adresse email.";
      if (erreur.statut === 400 || erreur.statut === 422) {
        return "Certaines informations sont invalides. Vérifiez le formulaire.";
      }
      break;
    case "renvoi":
      if (erreur.statut === 400 || erreur.statut === 422) return "Adresse email invalide.";
      break;
  }

  return "Une erreur inattendue est survenue. Réessayez.";
}
