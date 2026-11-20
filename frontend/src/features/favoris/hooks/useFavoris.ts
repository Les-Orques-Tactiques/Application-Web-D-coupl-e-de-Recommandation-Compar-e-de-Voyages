import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useExplorer, type Vol } from "@/features/explorer";
import { aPlusieursDevises, trierFavoris, type OrdrePrix } from "../utils/tri";
import { construireEtatDetailVol } from "../utils/etatDetailVol";

/**
 * Toute la logique de la page Favoris.
 * Les favoris viennent de useExplorer : ce sont les mêmes que sur Explorer et Mon compte.
 */
export function useFavoris() {
    const explorer = useExplorer();
    const navigate = useNavigate();
    const [ordrePrix, setOrdrePrix] = useState<OrdrePrix>("croissant");

    // useMemo : on ne retrie que si la liste ou l'ordre change
    const favorisTries = useMemo(
        () => trierFavoris(explorer.favoris, ordrePrix),
        [explorer.favoris, ordrePrix],
    );
    const plusieursDevises = aPlusieursDevises(explorer.favoris);

    function voirVol(vol: Vol) {
        const etat = construireEtatDetailVol(vol, explorer.favoris.length, explorer.favorisIds.has(vol.id));
        navigate(`/vol/${vol.id}`, { state: etat });
    }

    return { explorer, ordrePrix, setOrdrePrix, favorisTries, plusieursDevises, voirVol };
}