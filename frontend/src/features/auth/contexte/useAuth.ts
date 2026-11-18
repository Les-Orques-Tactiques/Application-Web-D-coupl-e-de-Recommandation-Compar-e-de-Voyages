import { createContext, useContext } from "react";
import type { seConnecter } from "../services/api";
import type { Utilisateur } from "../utils/types";

type ValeurContexteAuth = {
  utilisateur: Utilisateur | null; // null = personne n'est connecté
  chargement: boolean;             // true tant que /moi n'a pas répondu
  connecter: (identifiants: Parameters<typeof seConnecter>[0]) => Promise<Utilisateur>;
  deconnecter: () => Promise<void>;
  // Après le PATCH /moi ou l'onboarding, pour mettre à jour les infos affichées
  setUtilisateur: (utilisateur: Utilisateur | null) => void;
};

export const ContexteAuth = createContext<ValeurContexteAuth | null>(null);

/** Donne accès à la session depuis n'importe quel composant. */
export function useAuth() {
  const valeur = useContext(ContexteAuth);
  if (!valeur) throw new Error("useAuth doit être utilisé à l'intérieur de <FournisseurAuth>.");
  return valeur;
}
