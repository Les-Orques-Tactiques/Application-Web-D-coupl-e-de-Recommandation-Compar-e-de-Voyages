import { useState } from "react";
import { rechercherVols } from "@/features/explorer/services/explorationApi";
import { SAISIE_PAR_DEFAUT } from "../utils/constantes";
import { VOLS_DEMO } from "../utils/donneesDemo";
import { convertirVolExplorer, extraireCodeIata, messageErreur, verifierSaisie } from "../utils/recherche";
import type { SaisieRecherche, Vol } from "../utils/types";

/**
 * Données de la page : ce qui est saisi, les vols reçus, les favoris.
 * Même rôle que useExplorer pour PageExplorer.
 */
export function useResultats() {
    const [saisie, setSaisie] = useState<SaisieRecherche>(SAISIE_PAR_DEFAUT);
    const [vols, setVols] = useState<Vol[]>(VOLS_DEMO);
    const [favoris, setFavoris] = useState<string[]>([]);
    const [enCours, setEnCours] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);
    // false tant qu'on affiche les vols de démonstration
    const [depuisLaBase, setDepuisLaBase] = useState(false);

    // Partial : on peut ne changer qu'un champ, ex. modifierSaisie({ passagers: 2 })
    function modifierSaisie(changements: Partial<SaisieRecherche>) {
        setSaisie(precedente => ({ ...precedente, ...changements }));
    }

    /** Renvoie true si la recherche a réussi (la page ferme alors le formulaire). */
    async function lancerRecherche(budget: number): Promise<boolean> {
        const origine = extraireCodeIata(saisie.origine);
        const destination = extraireCodeIata(saisie.destination);
        const probleme = verifierSaisie(saisie, budget);
        // Le test sur origine/destination rassure aussi TypeScript : ce ne sont plus des null
        if (probleme || !origine || !destination) {
            setErreur(probleme ?? "Codes IATA invalides.");
            return false;
        }

        setEnCours(true);
        setErreur(null);
        try {
            const trouves = await rechercherVols({
                origine,
                destination,
                date_depart: saisie.aller,
                date_retour: saisie.allerRetour ? saisie.retour : null,
                aller_retour: saisie.allerRetour,
                nb_passagers: saisie.passagers,
                budget_max: budget,
                devise: "EUR",
                direct_seulement: false, // les filtres d'escales s'appliquent ensuite côté page
                bagage_requis: false,
            });
            setVols(trouves.map(convertirVolExplorer));
            setFavoris(trouves.filter(vol => vol.favori).map(vol => vol.id));
            setDepuisLaBase(true);
            return true;
        } catch (e: unknown) {
            setErreur(messageErreur(e));
            return false;
        } finally {
            setEnCours(false);
        }
    }

    // Pour l'instant, local seulement. À brancher sur l'API des favoris
    // (comme basculerFavori dans useExplorer).
    function basculerFavori(id: string) {
        setFavoris(precedents =>
            precedents.includes(id) ? precedents.filter(f => f !== id) : [...precedents, id],
        );
    }

    return { saisie, modifierSaisie, vols, favoris, basculerFavori, lancerRecherche, enCours, erreur, depuisLaBase };
}