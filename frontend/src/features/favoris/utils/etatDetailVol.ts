import type { Vol } from "@/features/explorer";
import { convertirVolExplorer } from "@/features/rechercheVols/utils/recherche";
import type { EtatPageDetailVol } from "@/features/rechercheVols/pages/PageDetailVol";

/**
 * Construit le state passé à /vol/:id quand on ouvre un favori.
 * Le lien « Revenir » de la page détail ramène sur /favoris.
 */
export function construireEtatDetailVol(
    vol: Vol,
    nbFavoris: number,
    estFavori: boolean,
): EtatPageDetailVol {
    return {
        vol: convertirVolExplorer(vol),
        saisie: {
            origine: vol.origine,
            destination: vol.destination,
            aller: vol.date_depart ?? "",
            retour: vol.date_retour ?? "",
            allerRetour: vol.aller_retour,
            passagers: 1,
        },
        budget: vol.prix,
        depuisLaBase: true,
        nbResultats: nbFavoris,
        retour: "/favoris",
        favori: estFavori,
        devise: vol.devise,
    } satisfies EtatPageDetailVol;
}