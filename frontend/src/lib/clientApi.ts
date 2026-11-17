export class ErreurApi extends Error {
  constructor(public statut: number, message: string, public details?: unknown) {
    super(message);
  }
}

const METHODES_ECRITURE = ["POST", "PUT", "PATCH", "DELETE"];

function lireCookie(nom: string): string {
  const trouve = document.cookie.split("; ").find((c) => c.startsWith(`${nom}=`));
  return trouve ? decodeURIComponent(trouve.split("=")[1]) : "";
}

// Le back renvoie { detail: "texte" } ou { detail: {champ: [messages]} } ou, pour Pydantic (422), une liste.
function extraireMessage(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => d?.msg ?? "").join(" ");
  if (detail && typeof detail === "object") return Object.values(detail).flat().join(" ");
  return "Erreur inconnue.";
}

interface Options { methode?: string; corps?: unknown }

async function requete(chemin: string, { methode = "GET", corps }: Options) {
  const headers: Record<string, string> = {};
  if (corps !== undefined) headers["Content-Type"] = "application/json";
  if (METHODES_ECRITURE.includes(methode)) {
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

export async function appelerApi<T = unknown>(chemin: string, options: Options = {}): Promise<T> {
  let reponse = await requete(chemin, options);

  // Access token expiré (30 min) : on tente un refresh silencieux, puis on rejoue la requête une fois.
  if (reponse.status === 401 && !chemin.startsWith("/api/auth/")) {
    const refresh = await requete("/api/auth/rafraichir", { methode: "POST" });
    if (refresh.ok) reponse = await requete(chemin, options);
  }

  const donnees = await reponse.json().catch(() => null);
  if (!reponse.ok) {
    throw new ErreurApi(reponse.status, extraireMessage(donnees?.detail), donnees?.detail);
  }
  return donnees as T;
}