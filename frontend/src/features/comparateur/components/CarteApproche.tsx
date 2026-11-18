import { Minus, Plus } from "lucide-react";
import type { InfoApproche } from "../utils/approches";

interface PropsCarteApproche {
    approche: InfoApproche;
    active: boolean;
    onChoisir: () => void;
}

/**
 * Une carte cliquable (A, B ou Hybride).
 * C'est un <button> et plus un <article onClick> : il devient utilisable
 * au clavier (Tab + Entrée) et aria-pressed annonce l'état aux lecteurs d'écran.
 */
export function CarteApproche({ approche, active, onChoisir }: PropsCarteApproche) {
    return (
        <button
            type="button"
            onClick={onChoisir}
            aria-pressed={active}
            className={`rounded-2xl border p-6 text-left transition-all ${active
                    ? "border-profond bg-profond text-white shadow-md"
                    : "border-trait bg-white text-encre hover:border-principal/50"
                }`}
        >
            <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-bold uppercase tracking-[0.1em] ${active ? "text-menthe" : "text-principal"}`}>
                    {approche.surTitre}
                </span>
                {active && (
                    <span className="rounded-full bg-citron px-2.5 py-0.5 text-[11px] font-bold text-profond">
                        Sélectionnée
                    </span>
                )}
            </div>

            <h2 className="mt-2 text-xl font-semibold">{approche.titre}</h2>
            <p className={`mt-2.5 text-sm leading-relaxed ${active ? "text-white/80" : "text-attenue"}`}>
                {approche.description}
            </p>

            <ul className="mt-5 space-y-2.5 text-[13px]">
                <li className="flex items-start gap-2">
                    <Plus className={`mt-0.5 size-4 shrink-0 ${active ? "text-citron" : "text-principal"}`} aria-hidden />
                    <span>{approche.avantage}</span>
                </li>
                <li className={`flex items-start gap-2 ${active ? "text-white/70" : "text-attenue"}`}>
                    <Minus className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <span>{approche.limite}</span>
                </li>
            </ul>
        </button>
    );
}