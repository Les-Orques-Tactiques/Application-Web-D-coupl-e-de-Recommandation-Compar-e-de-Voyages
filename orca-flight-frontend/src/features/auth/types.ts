// Les "interfaces" et "types" ne produisent aucun code : ils servent à TypeScript pour
// vérifier que l'on manipule les bonnes données (il signale une faute de frappe ou un oubli).

/** Les trois cases de confidentialité du formulaire d'inscription. */
export interface Consentements {
  conditions: boolean; // obligatoire : conditions d'utilisation et confidentialité
  personnalisation: boolean; // facultatif
  geolocalisation: boolean; // facultatif
}

/** Tout ce qu'on envoie au serveur pour créer un compte. */
export interface DonneesInscription {
  prenom: string;
  nom: string;
  email: string;
  motDePasse: string;
  consentements: Consentements;
}

/** Tout ce qu'on envoie au serveur pour se connecter. */
export interface DonneesConnexion {
  email: string;
  motDePasse: string;
}

/**
 * Les cinq états possibles de la page d'activation (un type "union" : une seule de ces valeurs).
 * en_attente : on a envoyé le mail, on attend que la personne clique
 * chargement : le lien a été cliqué, on vérifie le jeton auprès du serveur
 * succes / expire / invalide : résultat de la vérification
 */
export type StatutActivation = "en_attente" | "chargement" | "succes" | "expire" | "invalide";
