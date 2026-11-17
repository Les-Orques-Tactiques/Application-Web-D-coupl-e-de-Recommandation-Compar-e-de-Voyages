import { ErreurApi, appelerApi } from "@/lib/clientApi";
import type { DonneesConnexion, DonneesInscription } from "./types";

// Mode simulé : quand VITE_MOCK_API=true dans .env, les fonctions ci-dessous ne contactent
// pas le serveur et répondent elles-mêmes. Pratique pour tester l'interface sans backend.
const MODE_SIMULE = import.meta.env.VITE_MOCK_API === "true";

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
  if (MODE_SIMULE) {
    await attendre();
    return; // "return" ici termine la fonction : on ne contacte pas le serveur
  }
  // Les clés envoyées au backend restent en anglais (c'est le contrat d'API convenu avec Flask) :
  // cette fonction fait donc la traduction de nos noms français vers ceux du serveur.
  await appelerApi("/api/auth/register", {
    methode: "POST",
    corps: {
      first_name: donnees.prenom,
      last_name: donnees.nom,
      email: donnees.email,
      password: donnees.motDePasse,
      consents: {
        terms: donnees.consentements.conditions,
        personalization: donnees.consentements.personnalisation,
        geolocation: donnees.consentements.geolocalisation,
      },
    },
  });
}

/**
 * Connecte la personne. Lance une ErreurApi si les identifiants sont faux (401)
 * ou si le compte n'est pas encore activé (403).
 */
export async function seConnecter(donnees: DonneesConnexion): Promise<void> {
  if (MODE_SIMULE) {
    await attendre();
    // Simulation : tout mot de passe d'au moins 12 caractères est accepté, les autres refusés
    if (donnees.motDePasse.length < 12) throw new ErreurApi(401, "Identifiants incorrects.");
    return;
  }
  await appelerApi("/api/auth/login", {
    methode: "POST",
    corps: { email: donnees.email, password: donnees.motDePasse },
  });
}

/**
 * Active le compte grâce au jeton reçu dans le lien du mail.
 * Réponses attendues du serveur : 200 = activé, 410 = lien expiré, 400 = lien invalide.
 */
export async function activerCompte(jeton: string): Promise<void> {
  if (MODE_SIMULE) {
    await attendre();
    // Simulation : "expire" donne un lien expiré, "ok" un succès, tout le reste est invalide
    if (jeton === "expire") throw new ErreurApi(410, "Lien expiré.");
    if (jeton !== "ok") throw new ErreurApi(400, "Lien invalide.");
    return;
  }
  await appelerApi("/api/auth/activate", { methode: "POST", corps: { token: jeton } });
}

/** Demande au serveur d'envoyer un nouvel e-mail d'activation (le lien dure 24 h). */
export async function renvoyerEmailActivation(email: string): Promise<void> {
  if (MODE_SIMULE) {
    await attendre();
    return;
  }
  await appelerApi("/api/auth/resend-activation", { methode: "POST", corps: { email } });
}
