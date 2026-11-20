import { useEffect, useRef, useState } from "react";
import { definirFavori, lireFavoris, rechercherVols } from "@/features/explorer/services/explorationApi";
// ⚠️ versRequeteApi doit être exporté dans explorer/index.ts :
//    export { useExplorer, versRequeteApi, type CriteresRecherche } from "./hooks/useExplorer";
import { versRequeteApi, type CriteresRecherche } from "@/features/explorer";
import { SAISIE_PAR_DEFAUT } from "../utils/constantes";
import { VOLS_DEMO } from "../utils/donneesDemo";
import { convertirVolExplorer, extraireCodeIata, messageErreur, verifierSaisie } from "../utils/recherche";
import type { SaisieRecherche, Vol } from "../utils/types";

/** Traduit les critères venus d'Explorer (via l'URL) au format du formulaire de cette page. */
function criteresVersSaisie(c: CriteresRecherche): SaisieRecherche {
    return {
        ...SAISIE_PAR_DEFAUT,
        origine: c.origine, // "LYS" seul fonctionne avec extraireCodeIata
        destination: c.destination,
        aller: c.date_depart,
        retour: c.date_retour ?? "",
        allerRetour: c.aller_retour,
        passagers: c.nb_passagers,
    };
}

/**
 * Données de la page : ce qui est saisi, les vols reçus, les favoris.
 * Même rôle que useExplorer pour PageExplorer.
 *
 * @param criteresInitiaux critères lus dans l'URL (null si on arrive sans recherche).
 *        S'ils sont fournis, la recherche se lance automatiquement à l'ouverture.
 */
export function useResultats(criteresInitiaux?: CriteresRecherche | null) {
    const [saisie, setSaisie] = useState<SaisieRecherche>(() =>
        criteresInitiaux ? criteresVersSaisie(criteresInitiaux) : SAISIE_PAR_DEFAUT,
    );
    // Vols de démonstration seulement si on arrive sans recherche
    const [vols, setVols] = useState<Vol[]>(criteresInitiaux ? [] : VOLS_DEMO);
    const [favoris, setFavoris] = useState<string[]>([]);
    const [enCours, setEnCours] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);
    // false tant qu'on affiche les vols de démonstration
    const [depuisLaBase, setDepuisLaBase] = useState(false);
    // Empêche la double recherche automatique (StrictMode exécute les effets 2 fois en dev)
    const rechercheAutoFaite = useRef(false);

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
            // versRequeteApi traduit nos noms de champs vers ceux attendus par l'API
            // (nb_passagers → passagers, budget_max → budget, etc.)
            const trouves = await rechercherVols(
                versRequeteApi({
                    origine,
                    destination,
                    date_depart: saisie.aller,
                    date_retour: saisie.allerRetour ? saisie.retour : null,
                    aller_retour: saisie.allerRetour,
                    nb_passagers: saisie.passagers,
                    budget_max: budget,
                    direct_seulement: false, // les filtres d'escales s'appliquent ensuite côté page
                }),
            );
            setVols(trouves.map(convertirVolExplorer));
            setDepuisLaBase(true);
            return true;
        } catch (e: unknown) {
            setErreur(messageErreur(e));
            return false;
        } finally {
            setEnCours(false);
        }
    }

    // Charge les favoris enregistrés une seule fois, à l'ouverture de la page
    useEffect(() => {
        let actif = true;
        lireFavoris()
            .then(liste => {
                if (actif) setFavoris(liste.map(vol => vol.id));
            })
            .catch(() => {
                /* sans favoris (ex. non connecté), on garde une liste vide */
            });
        return () => {
            actif = false;
        };
    }, []);

    // Recherche automatique quand on arrive depuis Explorer avec des critères
    useEffect(() => {
        if (!criteresInitiaux || rechercheAutoFaite.current) return;
        rechercheAutoFaite.current = true;
        void lancerRecherche(criteresInitiaux.budget_max);
        // On veut ce lancement une seule fois, à l'ouverture : pas de dépendances
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /**
     * Ajoute ou retire un favori.
     * Mise à jour « optimiste » : l'écran change tout de suite,
     * et on revient en arrière si l'API refuse.
     */
    async function basculerFavori(id: string) {
        const etaitFavori = favoris.includes(id);
        setFavoris(precedents => (etaitFavori ? precedents.filter(f => f !== id) : [...precedents, id]));
        try {
            await definirFavori(id, !etaitFavori);
        } catch (e: unknown) {
            // Échec : on annule le changement affiché
            setFavoris(precedents => (etaitFavori ? [...precedents, id] : precedents.filter(f => f !== id)));
            setErreur(messageErreur(e));
        }
    }

    return { saisie, modifierSaisie, vols, favoris, basculerFavori, lancerRecherche, enCours, erreur, depuisLaBase };
}