import { formaterDecimal } from "../utils/format";
import type { VolClasse } from "../hooks/useComparateur";

interface PropsCurseurAlpha {
    alpha: number;
    sansHistorique: boolean;
    onChanger: (alpha: number) => void;
    premierVol?: VolClasse;
}

/** Curseur α + formule du score hybride appliquée au 1er vol */
export function CurseurAlpha({ alpha, sansHistorique, onChanger, premierVol }: PropsCurseurAlpha) {
    const pctContenu = Math.round((1 - alpha) * 100);
    const pctCollaboratif = Math.round(alpha * 100);

    return (
        <section className="rounded-2xl border border-trait bg-white p-5 sm:p-6">
            <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-2">
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <label htmlFor="curseur-alpha" className="text-base font-semibold text-encre">
                            Un peu de découverte ?
                        </label>
                        <span className="rounded-full bg-profond px-3 py-1 text-xs font-bold text-white">
                            α = {formaterDecimal(alpha)}
                        </span>
                    </div>

                    <input
                        id="curseur-alpha"
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={alpha}
                        disabled={sansHistorique}
                        onChange={e => onChanger(parseFloat(e.target.value))}
                        className="h-2 w-full cursor-pointer accent-principal disabled:cursor-not-allowed disabled:opacity-50"
                    />

                    <div className="flex justify-between text-xs font-medium text-attenue">
                        <span>0 · 100 % contenu</span>
                        <span>1 · 100 % collaboratif</span>
                    </div>
                </div>

                <div className="space-y-1.5 rounded-xl bg-menthe p-4 sm:p-5">
                    <p className="text-base font-semibold text-encre sm:text-lg">
                        Score final = (1 − α) × A + α × B
                    </p>
                    <p className="text-[13px] text-attenue">
                        {pctContenu} % contenu + {pctCollaboratif} % collaboratif
                        {sansHistorique && " (repli automatique sans historique)"}
                    </p>
                    {premierVol && (
                        <p className="text-[13px] font-medium text-encre">
                            {premierVol.compagnie} : {formaterDecimal(1 - alpha)} × {formaterDecimal(premierVol.scoreA)} +{" "}
                            {formaterDecimal(alpha)} × {formaterDecimal(premierVol.scoreB)} ={" "}
                            {formaterDecimal(premierVol.scoreHybride, 3)} ≈{" "}
                            <span className="font-bold text-principal">{formaterDecimal(premierVol.scoreHybride)}</span>
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}