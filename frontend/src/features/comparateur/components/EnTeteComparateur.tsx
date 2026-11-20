import { FlaskConical, Plane } from "lucide-react";

/** Bandeau sombre en haut de la page + avertissement « données de démonstration » */
export function EnTeteComparateur() {
    return (
        <header className="space-y-5">
            <div className="relative isolate overflow-hidden rounded-3xl bg-profond px-6 py-7 text-white md:px-10 md:py-9">
                <Plane
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-4 top-1/2 size-48 -translate-y-1/2 rotate-12 text-white/[0.06]"
                />
                <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-[10px] font-semibold tracking-[0.18em] text-citron">
                            LE LABORATOIRE ORCA
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                            Trois approches. Un même horizon.
                        </h1>
                        <p className="mt-2 max-w-md text-sm text-white/70">
                            Comparez ce qui change dans le classement, et comprenez les compromis.
                        </p>
                    </div>
                    <span className="w-fit rounded-full bg-citron px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-profond">
                        Données de démonstration
                    </span>
                </div>
            </div>

            {/* Tu peux remplacer ce bloc par ton composant <Bandeau ton=… titre=…> */}
            <div role="note" className="flex items-start gap-3 rounded-2xl border border-trait bg-menthe px-4 py-3.5">
                <FlaskConical className="mt-0.5 size-5 shrink-0 text-principal" aria-hidden />
                <div className="text-[13px]">
                    <p className="font-semibold text-encre">Des exemples, pas des mesures réelles</p>
                    <p className="mt-0.5 text-attenue">
                        Offres, scores, temps, qualité et énergie sont des valeurs illustratives cohérentes
                        pour la maquette. Les métriques portent sur un jeu d’évaluation fictif, pas sur des
                        performances mesurées en production.
                    </p>
                </div>
            </div>
        </header>
    );
}