export const LONGUEUR_MIN_MOT_DE_PASSE = 8;
export const LONGUEUR_MAX_MOT_DE_PASSE = 128;
export const OCTETS_MAX_MOT_DE_PASSE = 72;

const CARACTERE_SPECIAL = /[!@#$%^&*()\-_=+{};:,.<>?\/\\|`~"']/;

/** Texte d'aide affiché sous les champs « mot de passe ». */
export const AIDE_MOT_DE_PASSE =
  `${LONGUEUR_MIN_MOT_DE_PASSE} caractères minimum, avec une majuscule, un chiffre et un caractère spécial.`;

/**
 * Vérifie un mot de passe avec les mêmes règles que le back.
 * @returns Le message d'erreur à afficher, ou undefined si le mot de passe est valide.
 */
export function verifierMotDePasse(motDePasse: string): string | undefined {
  // Compte les points de code Unicode, comme len() en Python
  const longueur = Array.from(motDePasse).length;

  if (longueur < LONGUEUR_MIN_MOT_DE_PASSE) {
    return `Le mot de passe doit contenir au moins ${LONGUEUR_MIN_MOT_DE_PASSE} caractères.`;
  }
  if (longueur > LONGUEUR_MAX_MOT_DE_PASSE) {
    return `Le mot de passe doit contenir au maximum ${LONGUEUR_MAX_MOT_DE_PASSE} caractères.`;
  }
  if (!/[A-Z]/.test(motDePasse)) return "Le mot de passe doit contenir au moins une majuscule.";
  if (!/[0-9]/.test(motDePasse)) return "Le mot de passe doit contenir au moins un chiffre.";
  if (!CARACTERE_SPECIAL.test(motDePasse)) return "Le mot de passe doit contenir au moins un caractère spécial.";
  // Les accents et emojis prennent plusieurs octets en UTF-8
  if (new TextEncoder().encode(motDePasse).length > OCTETS_MAX_MOT_DE_PASSE) {
    return `Le mot de passe est trop long (${OCTETS_MAX_MOT_DE_PASSE} octets maximum).`;
  }
  return undefined;
}

/**
 * Vérifie le format d'une adresse e-mail (le trim évite de refuser un espace final
 * ajouté par l'autocomplétion).
 */
export function verifierEmail(email: string): string | undefined {
  return /^\S+@\S+\.\S+$/.test(email.trim()) ? undefined : "Saisissez une adresse e-mail valide.";
}

