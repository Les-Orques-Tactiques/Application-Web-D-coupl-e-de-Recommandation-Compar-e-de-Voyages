export class ErreurApi extends Error {
  constructor(public statut: number, message: string, public details?: unknown) {
    super(message);
    this.name = "ErreurApi";
  }
}

/** Événement envoyé quand la session ne peut plus être rafraîchie (écouté par FournisseurAuth). */
export const EVENEMENT_SESSION_EXPIREE = "auth:session-expiree";

const METHODES_ECRITURE = ["POST", "PUT", "PATCH", "DELETE"];
const CHEMIN_RAFRAICHIR = "/api/auth/rafraichir";
// Routes où un 401 ne veut PAS dire « jeton expiré » : on ne tente donc pas de rafraîchir
const ROUTES_SANS_RAFRAICHISSEMENT = ["/api/auth/connexion", CHEMIN_RAFRAICHIR];

function lireCookie(nom: string): string {
  const trouve = document.cookie.split("; ").find((c) => c.startsWith(`${nom}=`));
  // slice plutôt que split("=")[1] : la valeur reste entière même si elle contient un "="
  return trouve ? decodeURIComponent(trouve.slice(nom.length + 1)) : "";
}

// Le back renvoie { detail: "texte" } ou { detail: {champ: [messages]} } ou, pour Pydantic (422), une liste.
function extraireMessage(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => d?.msg ?? "").join(" ");
  if (detail && typeof detail === "object") return Object.values(detail).flat().join(" ");
  return "Erreur inconnue.";
}

interface Options { methode?: string; corps?: unknown }

async function requete(chemin: string, { methode = "GET", corps }: Options = {}) {
  const headers: Record<string, string> = {};
  if (corps !== undefined) headers["Content-Type"] = "application/json";
  if (METHODES_ECRITURE.includes(methode)) {
    // Relu à chaque requête : le cookie csrf_token change après chaque rafraîchissement
    const csrf = lireCookie("csrf_token");
    if (csrf) headers["X-CSRF-Token"] = csrf;
  }
  return fetch(chemin, {
    method: methode,
    headers,
    credentials: "include",
    body: corps !== undefined ? JSON.stringify(corps) : undefined,
  });
}

/**
 * Rafraîchissement partagé : si plusieurs requêtes reçoivent un 401 en même temps,
 * elles attendent toutes LE MÊME appel à /rafraichir au lieu d'en lancer un chacune.
 */
let rafraichissementEnCours: Promise<boolean> | null = null;

function rafraichirSession(): Promise<boolean> {
  // ??= : on ne crée la promesse que s'il n'y en a pas déjà une en cours
  rafraichissementEnCours ??= requete(CHEMIN_RAFRAICHIR, { methode: "POST" })
    .then((reponse) => reponse.ok)
    .catch(() => false) // réseau coupé = échec
    .finally(() => {
      rafraichissementEnCours = null; // le prochain 401 pourra relancer un rafraîchissement
    });
  return rafraichissementEnCours;
}

export async function appelerApi<T = unknown>(chemin: string, options: Options = {}): Promise<T> {
  let reponse = await requete(chemin, options);

  // Access token expiré (30 min) : refresh silencieux, puis on rejoue la requête une seule fois.
  if (reponse.status === 401 && !ROUTES_SANS_RAFRAICHISSEMENT.includes(chemin)) {
    if (await rafraichirSession()) {
      reponse = await requete(chemin, options);
    } else {
      // Refresh token expiré ou révoqué : on prévient l'interface (FournisseurAuth passe l'utilisateur à null)
      window.dispatchEvent(new Event(EVENEMENT_SESSION_EXPIREE));
    }
  }

  const donnees = await reponse.json().catch(() => null); // 204 ou corps vide → null
  if (!reponse.ok) {
    throw new ErreurApi(reponse.status, extraireMessage(donnees?.detail), donnees?.detail);
  }
  return donnees as T;
}
