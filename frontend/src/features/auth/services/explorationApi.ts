import { appelerApi } from "@/lib/clientApi";

export interface RechercheVols {
  origine: string;
  destination: string;
  date_depart: string;
  date_retour: string | null;
  aller_retour: boolean;
  nb_passagers: number;
  budget_max: number;
  devise: string;
  direct_seulement: boolean;
  bagage_requis: boolean;
}

export interface VolExplorer {
  id: string;
  origine: string;
  destination: string;
  date_depart: string;
  date_retour: string | null;
  aller_retour: boolean;
  prix: number;
  devise: string;
  compagnie_aller: string;
  duree_aller_min: number;
  escales_aller: number;
  bagage_inclus: boolean | null;
  simulee: boolean;
  heure_depart: string | null;
  heure_arrivee: string | null;
  ville_origine: string | null;
  ville_destination: string | null;
  favori: boolean;
}

export interface RechercheHistorique {
  id: string;
  origine: string | null;
  destination: string | null;
  ville_origine: string | null;
  ville_destination: string | null;
  date_depart: string | null;
  date_retour: string | null;
  aller_retour: boolean;
  nb_passagers: number;
  budget_max: number | null;
  cree_le: string;
}

export async function rechercherVols(criteres: RechercheVols): Promise<VolExplorer[]> {
  return appelerApi<VolExplorer[]>("/api/exploration/recherches", {
    methode: "POST",
    corps: criteres,
  });
}

export const lireFavoris = () => appelerApi<VolExplorer[]>("/api/exploration/favoris");

export const lireHistorique = () =>
  appelerApi<RechercheHistorique[]>("/api/exploration/historique");

export async function definirFavori(volId: string, favori: boolean): Promise<void> {
  await appelerApi<{ favori: boolean }>(`/api/exploration/favoris/${volId}`, {
    methode: favori ? "POST" : "DELETE",
  });
}
