import { ArrowRight } from "lucide-react";
import { Bouton } from "@/components/ui/Bouton";
import type { RechercheHistorique } from "@/features/explorer";
import { heureDeRecherche } from "../utils/dates";
import { resume } from "../utils/resume";

type PropsCarte = {
    recherche: RechercheHistorique;
    onSupprimer: (id: string) => void;
    onRelancer: (recherche: RechercheHistorique) => void;
};

/** Une recherche de l'historique : trajet, détails, boutons Supprimer et Relancer. */
export function CarteRecherche({ recherche: r, onSupprimer, onRelancer }: PropsCarte) {
    return (
        <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-trait bg-white p-5 text-[13px] text-encre">
            <div>
                <p className={`text-[15px] font-medium ${r.relancable ? "text-encre" : "text-attenue"}`}>
                    {r.origine ?? "Départ"} → {r.ville_destination ?? r.destination ?? "Destination"}
                    {!r.relancable && <small className="ml-2 text-[11px] font-normal text-attenue">(aéroport supprimé)</small>}
                </p>
                <p className="mt-1 text-attenue">
                    {resume(r)}
                    {r.cree_le && ` · recherché à ${heureDeRecherche(r.cree_le)}`}
                </p>
            </div>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => onSupprimer(r.id)}
                    className="rounded-lg px-3 py-2 text-attenue hover:text-erreur"
                >
                    Supprimer
                </button>
                <Bouton taille="petite" disabled={!r.relancable} onClick={() => onRelancer(r)}>
                    Relancer <ArrowRight className="size-4" aria-hidden="true" />
                </Bouton>
            </div>
        </li>
    );
}