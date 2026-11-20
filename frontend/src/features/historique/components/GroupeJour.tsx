import type { RechercheHistorique } from "@/features/explorer";
import { libelleJour, type GroupeDeRecherches } from "../utils/dates";
import { CarteRecherche } from "./CarteRecherche";

type PropsGroupe = {
    groupe: GroupeDeRecherches;
    onSupprimer: (id: string) => void;
    onRelancer: (recherche: RechercheHistorique) => void;
};

/** Les recherches d'un même jour, sous un titre « Aujourd'hui », « Hier » ou la date. */
export function GroupeJour({ groupe, onSupprimer, onRelancer }: PropsGroupe) {
    return (
        <div className="mt-8 first:mt-0">
            {/* h2 (et non h3) : on ne saute pas de niveau après le h1 de la page */}
            <h2 className="mb-3 text-[13px] font-medium text-attenue">{libelleJour(groupe.cle)}</h2>
            <ul className="space-y-3">
                {groupe.recherches.map((r) => (
                    <CarteRecherche key={r.id} recherche={r} onSupprimer={onSupprimer} onRelancer={onRelancer} />
                ))}
            </ul>
        </div>
    );
}