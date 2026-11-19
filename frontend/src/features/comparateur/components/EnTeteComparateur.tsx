import { FlaskConical } from "lucide-react";

/** Titre de la page + avertissement « données de démonstration » */
export function EnTeteComparateur() {
    return (
        <header className="space-y-5">
            <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-principal">
                    Le laboratoire Orca
                </p>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-3xl font-semibold tracking-tight text-encre sm:text-4xl">
                        Trois approches. Un même horizon.
                    </h1>
                    <span className="rounded-full bg-citron px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-profond">
                        Données de démonstration
                    </span>
                </div>
                <p className="text-[13px] text-attenue">
                    Comparez ce qui change dans le classement, et comprenez les compromis.
                </p>
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