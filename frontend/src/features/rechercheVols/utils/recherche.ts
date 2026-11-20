import { ErreurApi } from "@/lib/clientApi";
import type { Vol as VolApi } from "@/features/explorer";
import type { SaisieRecherche, Vol } from "./types";
import { formaterHeure } from "@/features/explorer/utils/formatage";

/** "Paris CDG" → "CDG" ; null si la saisie ne finit pas par 3 lettres. */
export function extraireCodeIata(lieu: string): string | null {
    return lieu.trim().match(/(?:^|\s)([a-z]{3})$/i)?.[1]?.toUpperCase() ?? null;
}

/** Renvoie un message si la saisie est invalide, sinon null. */
export function verifierSaisie(saisie: SaisieRecherche, budget: number): string | null {
    const origine = extraireCodeIata(saisie.origine);
    const destination = extraireCodeIata(saisie.destination);

    if (!origine || !destination) return "Saisissez le code IATA à trois lettres avec chaque ville (ex. Paris CDG).";
    if (origine === destination) return "Les aéroports de départ et d’arrivée doivent être différents.";
    if (!saisie.aller || (saisie.allerRetour && (!saisie.retour || saisie.retour < saisie.aller))) {
        return "Vérifiez les dates de départ et de retour.";
    }
    if (!Number.isFinite(budget) || budget <= 0) return "Le budget doit être supérieur à 0 €.";
    return null;
}

/** Transforme une erreur de l'API en phrase lisible. */
export function messageErreur(erreur: unknown): string {
    if (erreur instanceof ErreurApi && erreur.statut === 401) {
        return "Connectez-vous pour rechercher des vols dans la base de données.";
    }
    if (erreur instanceof ErreurApi && erreur.statut >= 500) {
        return "Désolé, le vol que vous recherchez actuellement n’est pas disponible.";
    }
    const detail = erreur instanceof Error ? erreur.message : "erreur inconnue.";
    return `La recherche dans la base de données a échoué : ${detail}`;
}

function libelleEscale(n: number): string | null {
    return n > 0 ? `${n} escale${n > 1 ? "s" : ""}` : null;
}

/** Convertit un vol renvoyé par l'API au format affiché par la page. */
export function convertirVolExplorer(vol: VolApi): Vol {
    return {
        id: vol.id,
        compagnie: vol.compagnie_aller,
        code: vol.compagnie_aller.slice(0, 2).toUpperCase(),
        // Si l'heure est absente (null), on affiche "--:--" à la place
        depart: formaterHeure(vol.depart_aller_local) ?? "--:--",
        arrivee: formaterHeure(vol.arrivee_aller_locale) ?? "--:--",
        duree: vol.duree_aller_min,
        prix: vol.prix,
        escale: libelleEscale(vol.escales_aller),
        message: vol.simulee
            ? "Itinéraire simulé présent dans la base de données."
            : "Vol trouvé dans la base de données.",
        lieuDepart: `${vol.origine} · ${vol.ville_origine ?? "Départ"}`,
        lieuArrivee: `${vol.destination} · ${vol.ville_destination ?? "Arrivée"}`,
        dateDepart: vol.date_depart,
        ...(vol.aller_retour && {
            dateRetour: vol.date_retour ?? undefined,
            departRetour: formaterHeure(vol.depart_retour_local) ?? "--:--",
            arriveeRetour: formaterHeure(vol.arrivee_retour_locale) ?? "--:--",
            dureeRetour: vol.duree_retour_min ?? undefined,
            escaleRetour: libelleEscale(vol.escales_retour ?? 0),
        }),
    };
}