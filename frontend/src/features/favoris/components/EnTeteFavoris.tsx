import { Heart, Plane } from "lucide-react";

type ProprietesEnTeteFavoris = {
    nbFavoris: number;
};

/** Bandeau sombre en haut de la page, avec l'avion décoratif et le compteur. */
export function EnTeteFavoris({ nbFavoris }: ProprietesEnTeteFavoris) {
    return (
        <header className="relative isolate mb-8 overflow-hidden rounded-3xl bg-profond px-6 py-7 text-white md:px-10 md:py-9">
            <Plane
                aria-hidden="true"
                className="pointer-events-none absolute -right-4 top-1/2 size-48 -translate-y-1/2 rotate-12 text-white/[0.06]"
            />
            <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                <div>
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-citron">
                        VOTRE CARNET DE VOYAGE
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Mes favoris</h1>
                    <p className="mt-2 max-w-md text-sm text-white/70">
                        Vos itinéraires préférés, réunis au même endroit.
                    </p>
                </div>
                <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                    <Heart aria-hidden="true" className="size-5 text-citron" fill="currentColor" />
                    <span className="text-2xl font-semibold">{nbFavoris}</span>
                    <span className="text-xs text-white/75">favoris enregistrés</span>
                </div>
            </div>
        </header>
    );
}