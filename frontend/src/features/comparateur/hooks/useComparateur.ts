import { useEffect, useMemo, useRef, useState } from "react";
import {
    PROFILS_DEMO,
    type ApprocheId,
    type VolComparaison,
} from "../utils/donneesComparateur";

export interface VolClasse extends VolComparaison {
    scoreHybride: number;
    scoreActif: number;
}

/**
 * Toute la logique du comparateur (états + calculs).
 * Même rôle que useExplorer : la page n'a plus qu'à afficher.
 */
export function useComparateur() {
    const [profilId, setProfilId] = useState("camille");
    const [approche, setApproche] = useState<ApprocheId>("HYBRIDE");
    const [alpha, setAlpha] = useState(0.35);
    const [k, setK] = useState(5);
    const [rafraichissement, setRafraichissement] = useState(false);
    // Identifiant du minuteur (setTimeout) en cours, ou undefined s'il n'y en a pas
    const minuteur = useRef<number | undefined>(undefined);

    const profil = useMemo(
        () => PROFILS_DEMO.find(p => p.id === profilId) ?? PROFILS_DEMO[0],
        [profilId],
    );

    // Sans historique (0 interaction) : repli automatique sur A (α effectif = 0)
    const sansHistorique = profil.nbInteractions === 0;
    const alphaEffectif = sansHistorique ? 0 : alpha;

    // Calcule les scores puis trie selon l'approche sélectionnée
    const volsClasses = useMemo<VolClasse[]>(() => {
        const avecScores = profil.vols.map(vol => {
            const scoreHybride = (1 - alphaEffectif) * vol.scoreA + alphaEffectif * vol.scoreB;
            let scoreActif = scoreHybride;
            if (approche === "A") scoreActif = vol.scoreA;
            if (approche === "B" && !sansHistorique) scoreActif = vol.scoreB;
            return { ...vol, scoreHybride, scoreActif };
        });
        return avecScores.sort((a, b) => b.scoreActif - a.scoreActif);
    }, [profil, alphaEffectif, approche, sansHistorique]);

    // Le vol que B mettrait en tête (la « découverte » collaborative)
    const decouverteB = useMemo(() => {
        if (sansHistorique || profil.vols.length === 0) return null;
        return [...profil.vols].sort((a, b) => b.scoreB - a.scoreB)[0];
    }, [profil, sansHistorique]);

    // Petite animation de l'icône du bouton « Comparer »
    function comparer() {
        setRafraichissement(true);
        window.clearTimeout(minuteur.current);
        minuteur.current = window.setTimeout(() => setRafraichissement(false), 350);
    }

    // On annule le minuteur si la page est quittée avant la fin
    useEffect(() => () => window.clearTimeout(minuteur.current), []);

    return {
        profils: PROFILS_DEMO,
        profil,
        choisirProfil: setProfilId,
        approche,
        choisirApproche: setApproche,
        alpha: alphaEffectif,
        changerAlpha: setAlpha,
        k,
        changerK: setK,
        sansHistorique,
        volsClasses,
        premierVol: volsClasses[0] as VolClasse | undefined,
        decouverteB,
        rafraichissement,
        comparer,
    };
}