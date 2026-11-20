import { History, Plane } from "lucide-react";

type PropsEnTete = {
    chargement: boolean;
    nbRecherches: number;
    confirmerVidage: boolean;
    onVider: () => void;
    onAnnulerVidage: () => void;
};

/** Bandeau sombre en haut de la page, avec l'avion décoratif, le compteur et le bouton « Vider l'historique » (confirmation en 2 clics). */
export function EnTeteHistorique({ chargement, nbRecherches, confirmerVidage, onVider, onAnnulerVidage }: PropsEnTete) {
    return (
        <header className="relative isolate mb-8 overflow-hidden rounded-3xl bg-profond px-6 py-7 text-white md:px-10 md:py-9">
            <Plane
                aria-hidden="true"
                className="pointer-events-none absolute -right-4 top-1/2 size-48 -translate-y-1/2 rotate-12 text-white/[0.06]"
            />
            <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                <div>
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-citron">
                        VOS RECHERCHES
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Historique</h1>
                    <p className="mt-2 max-w-md text-sm text-white/70">
                        Retrouvez et relancez vos recherches passées.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                        <History aria-hidden="true" className="size-5 text-citron" />
                        <span className="text-2xl font-semibold">{chargement ? "…" : nbRecherches}</span>
                        <span className="text-xs text-white/75">recherche(s) affichée(s)</span>
                    </div>
                    {nbRecherches > 0 && (
                        <button
                            type="button"
                            onClick={onVider}
                            onBlur={onAnnulerVidage} // on annule la confirmation si on clique ailleurs
                            className={`rounded-lg border px-4 py-2 text-[13px] font-medium transition-colors ${confirmerVidage
                                    ? "border-erreur bg-erreur-fond text-erreur"
                                    : "border-white/15 bg-white/10 text-white hover:bg-white/20"
                                }`}
                        >
                            {confirmerVidage ? "Confirmer : tout supprimer" : "Vider l'historique"}
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}