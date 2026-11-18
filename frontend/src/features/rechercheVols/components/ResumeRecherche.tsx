import { Plane, SlidersHorizontal } from "lucide-react";
import { formaterDates, pluriel } from "../utils/formats";
import { boutonSecondaire } from "../utils/styles";
import type { SaisieRecherche } from "../utils/types";

type PropsResumeRecherche = {
    saisie: SaisieRecherche;
    budget: number;
    edition: boolean;
    onModifier: (changements: Partial<SaisieRecherche>) => void;
    onBasculerEdition: () => void;
};

// La largeur suit le texte tapé : impossible en classe Tailwind fixe, d'où le style en ligne
function largeur(texte: string) {
    return { width: `${Math.min(Math.max(texte.length, 6), 18)}ch` };
}

const champ =
    "min-w-0 bg-transparent outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-principal";

/** Bandeau du haut : trajet modifiable + résumé des critères. */
export function ResumeRecherche({ saisie, budget, edition, onModifier, onBasculerEdition }: PropsResumeRecherche) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-trait bg-white px-5 py-4">
            <div className="flex items-center gap-4">
                <Plane aria-hidden="true" className="size-4 text-principal" />
                <div>
                    <p className="flex items-center gap-1 text-base text-encre">
                        <input
                            aria-label="Ville et aéroport de départ"
                            value={saisie.origine}
                            onChange={e => onModifier({ origine: e.target.value })}
                            className={champ}
                            style={largeur(saisie.origine)}
                        />
                        <span aria-hidden="true">→</span>
                        <input
                            aria-label="Ville et aéroport d’arrivée"
                            value={saisie.destination}
                            onChange={e => onModifier({ destination: e.target.value })}
                            className={champ}
                            style={largeur(saisie.destination)}
                        />
                    </p>
                    <p className="mt-1 text-[11px] text-attenue">
                        {formaterDates(saisie)} · {saisie.allerRetour ? "Aller-retour" : "Aller simple"} ·{" "}
                        {pluriel(saisie.passagers, "adulte")} · Budget {budget} €
                    </p>
                </div>
            </div>

            <button type="button" className={boutonSecondaire} onClick={onBasculerEdition} aria-expanded={edition}>
                Modifier la recherche <SlidersHorizontal aria-hidden="true" className="size-4" />
            </button>
        </div>
    );
}