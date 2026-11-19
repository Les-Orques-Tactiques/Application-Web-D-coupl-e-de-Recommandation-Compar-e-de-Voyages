import { Sparkles } from "lucide-react";
import { formaterDecimal } from "../utils/format";
import type { VolClasse } from "../hooks/useComparateur";
import type { ApprocheId, VolComparaison } from "../utils/donneesComparateur";

interface PropsClassementVols {
    vols: VolClasse[];
    approche: ApprocheId;
    sansHistorique: boolean;
    decouverteB: VolComparaison | null;
    premierVol?: VolClasse;
}

/** Tableau « Ce qui change dans la sélection » + encadré découverte B */
export function ClassementVols({ vols, approche, sansHistorique, decouverteB, premierVol }: PropsClassementVols) {
    const libelleRang = approche === "HYBRIDE" ? "hybride" : `approche ${approche}`;

    return (
        <div className="space-y-5 rounded-2xl border border-trait bg-white p-5 sm:p-6">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight text-encre">Ce qui change dans la sélection</h2>
                <p className="mt-1 text-[13px] text-attenue">
                    {vols.length} vols après filtres · Rang {libelleRang} · Scores de similarité, pas des probabilités d’achat.
                </p>
            </div>

            <div className="grid grid-cols-12 border-b border-trait pb-2 text-[11px] font-bold uppercase tracking-wider text-attenue">
                <div className="col-span-6">Vol / prix A/R</div>
                <div className="col-span-2 text-right">A</div>
                <div className="col-span-2 text-right">B</div>
                <div className="col-span-2 text-right">Hybride</div>
            </div>

            <ol className="space-y-4">
                {vols.map((vol, index) => {
                    // Barre entre 8 % (toujours visible) et 100 %
                    const largeur = Math.max(8, Math.min(100, Math.round(vol.scoreActif * 100)));
                    return (
                        <li key={vol.id} className="space-y-2">
                            <div className="grid grid-cols-12 items-center text-sm">
                                <div className="col-span-6 truncate pr-2 font-semibold text-encre">
                                    {index + 1}. {vol.compagnie} · {vol.escaleLabel} · {vol.prixEur} €
                                </div>
                                <div className="col-span-2 text-right text-attenue">{formaterDecimal(vol.scoreA)}</div>
                                <div className="col-span-2 text-right text-attenue">
                                    {sansHistorique ? "—" : formaterDecimal(vol.scoreB)}
                                </div>
                                <div className="col-span-2 text-right font-bold text-principal">
                                    {formaterDecimal(vol.scoreHybride)}
                                </div>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-menthe">
                                <div
                                    className="h-full rounded-full bg-principal transition-all duration-300"
                                    style={{ width: `${largeur}%` }}
                                />
                            </div>
                        </li>
                    );
                })}
            </ol>

            {decouverteB && premierVol && (
                <div className="flex items-start gap-3 rounded-xl bg-menthe p-4">
                    <Sparkles className="mt-0.5 size-5 shrink-0 text-principal" aria-hidden />
                    <div className="text-xs leading-relaxed">
                        <p className="font-semibold text-encre">La découverte côté B : {decouverteB.compagnie}</p>
                        <p className="mt-0.5 text-attenue">
                            B classe {decouverteB.compagnie} en tête ({formaterDecimal(decouverteB.scoreB)}) grâce aux
                            profils proches. L’hybride conserve {premierVol.compagnie} en premier, en accord avec vos
                            préférences de durée et de cabine.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}