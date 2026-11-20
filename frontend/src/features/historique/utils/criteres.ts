import type { CriteresRecherche, RechercheHistorique } from "@/features/explorer";

const BUDGET_SI_ABSENT = 1000; // même valeur que dans PageMonCompte

/**
 * Transforme une recherche de l'historique en critères pour la page Résultats.
 * Renvoie null si la recherche est incomplète (impossible à relancer).
 */
export function criteresDepuisHistorique(r: RechercheHistorique): CriteresRecherche | null {
    if (!r.origine || !r.destination || !r.date_depart) return null;
    return {
        origine: r.origine,
        destination: r.destination,
        date_depart: r.date_depart,
        date_retour: r.date_retour ?? "",
        aller_retour: r.aller_retour,
        nb_passagers: r.nb_passagers,
        budget_max: r.budget_max ?? BUDGET_SI_ABSENT,
        direct_seulement: r.autres_criteres.escales_max === 0,
    };
}