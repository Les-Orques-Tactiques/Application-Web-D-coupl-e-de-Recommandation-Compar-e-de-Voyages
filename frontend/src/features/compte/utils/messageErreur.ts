/** Transforme n'importe quelle erreur attrapée (type unknown) en texte lisible. */
export function messageErreur(erreur: unknown): string {
    return erreur instanceof Error ? erreur.message : "Une erreur inattendue est survenue.";
}