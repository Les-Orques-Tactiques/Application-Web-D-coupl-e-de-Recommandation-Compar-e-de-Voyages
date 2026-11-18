// Nom sous lequel l'adresse est rangée dans le stockage du navigateur
const CLE_EMAIL_EN_ATTENTE = "orca-flight:email-en-attente";

/**
 * Mémorise l'adresse e-mail de la personne qui vient de s'inscrire.
 * sessionStorage garde une information tant que l'onglet reste ouvert : si la page
 * /activation est rechargée, on retrouve l'adresse pour le bouton "Renvoyer l'e-mail".
 * Elle disparaît à la fermeture de l'onglet.
 */
export const emailEnAttente = {
  /** Renvoie l'adresse mémorisée, ou une chaîne vide s'il n'y en a pas. */
  lire: () => sessionStorage.getItem(CLE_EMAIL_EN_ATTENTE) ?? "",
  /** Enregistre (ou remplace) l'adresse mémorisée. */
  ecrire: (email: string) => sessionStorage.setItem(CLE_EMAIL_EN_ATTENTE, email),
};
