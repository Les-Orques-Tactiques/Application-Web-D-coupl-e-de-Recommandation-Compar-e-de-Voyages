import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type PropsEncart = { titre: string; icone: LucideIcon; children: ReactNode };

/** Petit encadré menthe d'explication. On passe l'icône elle-même : icone={Sparkles}. */
export function Encart({ titre, icone: Icone, children }: PropsEncart) {
    return (
        <div className="flex gap-3 rounded-lg bg-menthe/75 p-4">
            <Icone aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-principal" />
            <div>
                <h3 className="text-[11px] font-medium text-encre">{titre}</h3>
                <p className="mt-1 text-[10px] leading-relaxed text-attenue">{children}</p>
            </div>
        </div>
    );
}