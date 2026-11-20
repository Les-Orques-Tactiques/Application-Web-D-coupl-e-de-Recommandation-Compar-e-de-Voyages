import { useMemo, useState } from "react";
import { FILTRES_PAR_DEFAUT } from "../utils/constantes";
import type { Filtres, Tri, Vol } from "../utils/types";

/** true si le vol passe tous les filtres. */
function correspond(vol: Vol, f: Filtres): boolean {
    return (
        vol.prix <= f.budget &&
        vol.duree <= f.dureeMax * 60 &&
        !f.compagniesExclues.includes(vol.compagnie) &&
        (vol.escale ? f.escales : f.directs)
    );
}

// Une fonction de comparaison par tri ("pertinence" = ordre reçu, on ne trie pas)
const COMPARER: Record<Exclude<Tri, "pertinence">, (a: Vol, b: Vol) => number> = {
    prix: (a, b) => a.prix - b.prix,
    duree: (a, b) => a.duree - b.duree,
    depart: (a, b) => a.depart.localeCompare(b.depart),
};

/**
 * Filtres + tri appliqués à une liste de vols.
 *
 * 🆕 filtresInitiaux (optionnel) : valeurs venant de la page Explorer
 * (budget, vols directs seulement…). Partial = on ne fournit
 * que les champs qu'on veut changer, les autres gardent FILTRES_PAR_DEFAUT.
 */
export function useFiltres(vols: Vol[], filtresInitiaux?: Partial<Filtres>) {
    // 🆕 Calculé une seule fois au premier rendu (fonction passée à useState) :
    // si l'objet filtresInitiaux est recréé à chaque rendu, ça ne change rien.
    const [filtresDeDepart] = useState<Filtres>(() => ({
        ...FILTRES_PAR_DEFAUT,
        ...filtresInitiaux,
    }));

    const [filtres, setFiltres] = useState<Filtres>(filtresDeDepart);
    const [tri, setTri] = useState<Tri>("pertinence");

    // Générique : modifierFiltre("budget", 200) est accepté, modifierFiltre("budget", true) est refusé
    function modifierFiltre<K extends keyof Filtres>(cle: K, valeur: Filtres[K]) {
        setFiltres(precedents => ({ ...precedents, [cle]: valeur }));
    }

    function basculerCompagnie(nom: string) {
        setFiltres(f => ({
            ...f,
            compagniesExclues: f.compagniesExclues.includes(nom)
                ? f.compagniesExclues.filter(c => c !== nom)
                : [...f.compagniesExclues, nom],
        }));
    }

    // 🆕 Revient aux filtres de la recherche (ceux venus d'Explorer),
    // et non aux valeurs par défaut fixes.
    function reinitialiser() {
        setFiltres(filtresDeDepart);
    }

    // Liste des compagnies, sans doublon (Set)
    const compagnies = useMemo(() => [...new Set(vols.map(v => v.compagnie))], [vols]);

    const volsAffiches = useMemo(() => {
        const liste = vols.filter(v => correspond(v, filtres)); // filter crée déjà une copie
        return tri === "pertinence" ? liste : liste.sort(COMPARER[tri]);
    }, [vols, filtres, tri]);

    return { filtres, modifierFiltre, basculerCompagnie, reinitialiser, tri, setTri, compagnies, volsAffiches };
}