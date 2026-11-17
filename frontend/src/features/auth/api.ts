import { ErreurApi, appelerApi } from "@/lib/clientApi";
import type { DonneesConnexion, DonneesInscription, ReponseConnexion, Utilisateur } from "./types";


/**
 * Fait une pause (simule le temps de réponse d'un serveur).
 * Renvoie une "promesse" : un objet qui sera résolu plus tard, au bout du délai.
 * Avec "await attendre()", le code reprend après la pause.
 */
const attendre = (millisecondes = 600) => new Promise((resolu) => setTimeout(resolu, millisecondes));

/**
 * Crée un compte. Ne renvoie rien si tout va bien ; lance une ErreurApi sinon
 * (par exemple statut 409 si l'e-mail existe déjà).
 */
export async function creerCompte(donnees: DonneesInscription): Promise<void> {
  await appelerApi("/api/utilisateurs/inscription", {
    methode: "POST",
    corps: JSON.stringify({
      prenom: donnees.prenom,
      nom: donnees.nom,
      email: donnees.email,
      mot_de_passe: donnees.motDePasse,
      consentement_politique: donnees.consentements.conditions,
      consentement_personnalisation: donnees.consentements.personnalisation,
      consentement_localisation: donnees.consentements.geolocalisation,
    }),

  });
}

/**
 * Connecte la personne. Lance une ErreurApi si les identifiants sont faux (401)
 * ou si le compte n'est pas encore activé (403).
 */
export async function seConnecter(donnees: DonneesConnexion,): Promise<Utilisateur> {
  const reponse = await appelerApi<ReponseConnexion>(
    "/api/auth/connexion",
    {
      methode: "POST",
      corps: {
        email: donnees.email,
        mot_de_passe: donnees.motDePasse,
      },
    },
  );

  return reponse.utilisateur;
}

/**
 * Active le compte grâce au jeton reçu dans le lien du mail.
 * Réponses attendues du serveur : 200 = activé, 410 = lien expiré, 400 = lien invalide.
 */
export async function activerCompte(jeton: string): Promise<void> {
  await appelerApi("/api/utilisateurs/activation", { methode: "POST", corps: { jeton } });
}

/** Demande au serveur d'envoyer un nouvel e-mail d'activation (le lien dure 24 h). */
export async function renvoyerEmailActivation(email: string): Promise<void> {
  await appelerApi("/api/utilisateurs/activation/renvoyer", { methode: "POST", corps: { email } });
}

export const lireMonProfil = () => appelerApi<Utilisateur>("/api/auth/moi");
export const seDeconnecter = () => appelerApi("/api/auth/deconnexion", { methode: "POST" });
