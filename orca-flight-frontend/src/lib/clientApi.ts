// Adresse de base du backend, lue dans le fichier .env (variable VITE_API_URL).
// "??" signifie : si la variable n'existe pas, utiliser une chaîne vide.
// Vide = on appelle le même serveur que le site, ce qui marche avec le proxy de Vite.
const URL_DE_BASE = import.meta.env.VITE_API_URL ?? "";

/**
 * Erreur spéciale renvoyée quand le serveur répond avec un code d'échec (400, 401, 409…).
 * Elle "étend" l'erreur standard de JavaScript en y ajoutant le code HTTP (statut),
 * ce qui permet au reste du code de réagir selon le cas (ex. 409 = e-mail déjà utilisé).
 */
export class ErreurApi extends Error {
  constructor(
    public statut: number, // "public" crée automatiquement l'attribut : this.statut
    message: string,
    public code?: string, // "?" = facultatif : le serveur peut ne pas envoyer de code
  ) {
    super(message); // appelle le constructeur d'Error pour enregistrer le message
  }
}

// Options acceptées par appelerApi (type TypeScript : décrit la forme de l'objet attendu)
type OptionsAppel = { methode?: "GET" | "POST" | "PUT" | "DELETE"; corps?: unknown };

/**
 * Envoie une requête HTTP au backend Flask et renvoie sa réponse décodée.
 * C'est le SEUL endroit du frontend qui parle au réseau : si l'adresse du serveur ou
 * la gestion des erreurs change, on ne modifie que cette fonction.
 *
 * @param chemin  Route du backend, par exemple "/api/auth/login"
 * @param options methode (GET par défaut) et corps (les données à envoyer)
 * @returns       La réponse du serveur (déjà convertie du JSON en objet)
 * @throws        ErreurApi si le serveur répond avec un code d'échec
 *
 * <Reponse> est un "type générique" : l'appelant indique la forme attendue de la réponse.
 */
export async function appelerApi<Reponse = void>(
  chemin: string,
  { methode = "GET", corps }: OptionsAppel = {}, // déstructuration + valeurs par défaut
): Promise<Reponse> {
  // "await" attend la réponse du serveur sans bloquer la page
  const reponse = await fetch(`${URL_DE_BASE}${chemin}`, {
    method: methode,
    headers: { "Content-Type": "application/json" }, // on envoie du JSON
    body: corps === undefined ? undefined : JSON.stringify(corps), // objet -> texte JSON
    credentials: "include", // envoie et reçoit les cookies de session
  });

  // On lit le JSON de la réponse. Si elle est vide ou invalide, ".catch" renvoie null
  // au lieu de planter.
  const donnees = await reponse.json().catch(() => null);

  // reponse.ok vaut false pour les codes 400 à 599 : on transforme alors en erreur
  if (!reponse.ok) {
    throw new ErreurApi(reponse.status, donnees?.message ?? "Une erreur est survenue.", donnees?.code);
  }
  return donnees as Reponse;
}
