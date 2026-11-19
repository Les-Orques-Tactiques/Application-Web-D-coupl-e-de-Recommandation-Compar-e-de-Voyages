// Les "interfaces" et "types" ne produisent aucun code : ils servent à TypeScript pour
// vérifier que l'on manipule les bonnes données (il signale une faute de frappe ou un oubli).

/** Les trois cases de confidentialité du formulaire d'inscription. */
export interface Consentements {
  conditions: boolean; // obligatoire : conditions d'utilisation et confidentialité
  personnalisation: boolean; // facultatif
  geolocalisation: boolean; // facultatif
}

/** Utilisateur public renvoyé par le backend, sans mot de passe ni JWT. */
export interface Utilisateur {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: "utilisateur" | "evaluateur";
  actif: boolean;
  onboarding_termine: boolean;
  derniere_connexion: string | null;
  cree_le: string | null;
}

/** Réponse des routes de connexion et de rafraîchissement de session. */
export interface ReponseConnexion {
  utilisateur: Utilisateur;
  csrf_token: string;
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

// Les quatre champs texte du formulaire
export type ValeursFormulaire = { prenom: string; nom: string; email: string; motDePasse: string };
// Un message d'erreur possible par champ (Partial = chaque entrée est facultative : seuls les
// champs en erreur sont présents). "keyof" liste les noms des champs.
export type ErreursFormulaire = Partial<Record<keyof ValeursFormulaire | "conditions", string>>;

export type ErreursChamps = { motDePasse?: string; confirmation?: string };
