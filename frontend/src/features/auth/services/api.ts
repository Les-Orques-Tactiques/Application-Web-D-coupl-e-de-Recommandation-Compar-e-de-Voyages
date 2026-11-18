import { appelerApi } from "@/lib/clientApi";
import type { DonneesConnexion, DonneesInscription, ReponseConnexion, Utilisateur } from "../utils/types";

// Remarque : appelerApi fait lui-même le JSON.stringify de "corps".
// Il faut donc toujours passer un objet, jamais une chaîne JSON.

/**
 * Crée un compte. Ne renvoie rien si tout va bien ; lance une ErreurApi sinon
 * (409 si l'e-mail existe déjà, 422 si un champ est refusé, 429 si trop de tentatives).
 */
export async function creerCompte(donnees: DonneesInscription): Promise<void> {
  await appelerApi("/api/utilisateurs/inscription", {
    methode: "POST",
    // Conversion des noms du front (camelCase) vers ceux attendus par le back (snake_case)
    corps: {
      prenom: donnees.prenom,
      nom: donnees.nom,
      email: donnees.email,
      mot_de_passe: donnees.motDePasse,
      consentement_politique: donnees.consentements.conditions,
      consentement_personnalisation: donnees.consentements.personnalisation,
      consentement_localisation: donnees.consentements.geolocalisation,
    },
  });
}

/**
 * Connecte la personne et renvoie ses informations.
 * Lance une ErreurApi 401 si les identifiants sont faux OU si le compte n'est pas activé
 * (le back ne distingue pas les deux cas, volontairement), 429 si trop de tentatives.
 */
export async function seConnecter(donnees: DonneesConnexion): Promise<Utilisateur> {
  const reponse = await appelerApi<ReponseConnexion>("/api/auth/connexion", {
    methode: "POST",
    corps: {
      email: donnees.email,
      mot_de_passe: donnees.motDePasse,
    },
  });
  return reponse.utilisateur;
}

/**
 * Active le compte grâce au jeton reçu dans le lien du mail.
 * Réponses du serveur : 200 = activé, 400 = lien invalide, expiré ou déjà utilisé.
 */
export async function activerCompte(jeton: string): Promise<void> {
  await appelerApi("/api/utilisateurs/activation", { methode: "POST", corps: { jeton } });
}

/** Demande au serveur d'envoyer un nouvel e-mail d'activation (le lien dure 24 h). */
export async function renvoyerEmailActivation(email: string): Promise<void> {
  await appelerApi("/api/utilisateurs/activation/renvoyer", { methode: "POST", corps: { email } });
}

/**
 * Demande un e-mail de réinitialisation du mot de passe.
 * Le serveur répond de la même façon que l'adresse existe ou non : on affiche
 * donc toujours un message neutre en cas de succès.
 */
export async function demanderReinitialisation(email: string): Promise<void> {
  await appelerApi("/api/utilisateurs/mot-de-passe-oublie", { methode: "POST", corps: { email } });
}

/**
 * Choisit un nouveau mot de passe grâce au jeton reçu dans le lien du mail.
 * Réponses du serveur : 200 = mot de passe changé, 400 = lien invalide ou expiré,
 * 422 = mot de passe refusé par les règles du back.
 */
export async function reinitialiserMotDePasse(jeton: string, nouveauMotDePasse: string): Promise<void> {
  await appelerApi("/api/utilisateurs/reinitialisation", {
    methode: "POST",
    corps: { jeton, nouveau_mot_de_passe: nouveauMotDePasse },
  });
}

/** Renvoie la personne connectée (lance une ErreurApi 401 si personne ne l'est). */
export const lireMonProfil = () => appelerApi<Utilisateur>("/api/auth/moi");

/** Déconnecte la personne : le back révoque les jetons et supprime les cookies. */
export const seDeconnecter = () => appelerApi("/api/auth/deconnexion", { methode: "POST" });
