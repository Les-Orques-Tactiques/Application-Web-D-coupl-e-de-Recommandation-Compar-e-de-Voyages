import { appelerApi } from "@/lib/clientApi";
import { RechercheHistorique, RechercheVols, VolExplorer } from "../utils/types";

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
