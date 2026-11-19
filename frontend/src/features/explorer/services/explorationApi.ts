import { appelerApi } from "@/lib/clientApi";
import type { RechercheHistorique } from "../utils/types";

export type { RechercheHistorique } from "../utils/types";

// --- Types (miroirs des schémas Pydantic) -------------------------------
// UUID, date et datetime sont sérialisés en string (ISO 8601) par FastAPI.
// Les types Aeroport et Pays vivent dans features/referentiel.

// RechercheVolsIn (POST /vols/recherche)
export interface RechercheVols {
  origine: string;                 // code IATA, 3 lettres
  destination: string;
  date_depart: string;             // "YYYY-MM-DD", pas dans le passé
  aller_retour?: boolean;          // défaut backend : true
  date_retour?: string | null;     // requise si aller_retour
  passagers?: number;              // 1..9
  budget?: number | null;          // par personne
  escales_max?: number | null;     // 0..5 (0 = direct)
  compagnies?: string[];           // max 20
  bagage_inclus?: boolean | null;  // true = filtre bagage
  duree_max_min?: number | null;
  tolerance_jours?: number;        // 0..14, défaut 7
  tri?: "prix" | "duree" | "escales" | "pertinence";
  limite?: number;                 // 1..100, défaut 50
  decalage?: number;
}

// VolOut
export interface Vol {
  id: string;
  origine: string;
  destination: string;
  ville_origine: string | null;
  ville_destination: string | null;
  date_depart: string;
  date_retour: string | null;
  aller_retour: boolean;
  prix: number;
  devise: string;
  compagnie_aller: string;
  duree_aller_min: number;
  escales_aller: number;
  compagnie_retour: string | null;
  duree_retour_min: number | null;
  escales_retour: number | null;
  bagage_inclus: boolean | null;
  simulee: boolean;
  observe_le: string | null;
  depart_aller_local: string | null;
  arrivee_aller_locale: string | null;
}




// --- Vols ---------------------------------------------------------------

export const rechercherVols = (criteres: RechercheVols) =>
  appelerApi<Vol[]>("/api/vols/recherche", { methode: "POST", corps: criteres });

export const lireVol = (volId: string) => appelerApi<Vol>(`/api/vols/${volId}`);

// --- Historique ---------------------------------------------------------

export const lireHistorique = (limite = 20, decalage = 0) =>
  appelerApi<RechercheHistorique[]>(
    `/api/utilisateurs/moi/recherches?limite=${limite}&decalage=${decalage}`,
  );

export const relancerRecherche = (id: string) =>
  appelerApi<Vol[]>(`/api/utilisateurs/moi/recherches/${id}/relancer`, { methode: "POST" });

export async function supprimerRecherche(id: string): Promise<void> {
  await appelerApi<void>(`/api/utilisateurs/moi/recherches/${id}`, { methode: "DELETE" });
}

export const viderHistorique = () =>
  appelerApi<{ supprimees: number }>("/api/utilisateurs/moi/recherches", {
    methode: "DELETE",
  });

// --- Favoris -------------------------------------------------------------
// GET : les 50 plus récents par défaut. POST et DELETE sont idempotents (204) :
// rejouer une requête ne produit ni erreur ni doublon.

export const lireFavoris = () => appelerApi<Vol[]>("/api/utilisateurs/moi/favoris");

export async function definirFavori(volId: string, favori: boolean): Promise<void> {
  await appelerApi<void>(`/api/utilisateurs/moi/favoris/${volId}`, {
    methode: favori ? "POST" : "DELETE",
  });
}