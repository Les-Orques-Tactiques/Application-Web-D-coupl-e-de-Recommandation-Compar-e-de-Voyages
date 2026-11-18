import { Clock } from "lucide-react";
import { DUREES_MAX } from "../utils/constantes";
import type { Filtres, Vol } from "../utils/types";

function CaseFiltre({ libelle, coche, onBasculer }: { libelle: string; coche: boolean; onBasculer: () => void }) {
    return (
        <label className="flex cursor-pointer items-center gap-2 text-[11px] leading-5 text-attenue">
            <input type="checkbox" checked={coche} onChange={onBasculer} className="size-3.5 rounded accent-principal" />
            {libelle}
        </label>
    );
}

type PropsPanneauFiltres = {
    filtres: Filtres;
    vols: Vol[];          // tous les vols reçus, pour afficher les compteurs
    compagnies: string[];
    onModifier: <K extends keyof Filtres>(cle: K, valeur: Filtres[K]) => void;
    onBasculerCompagnie: (nom: string) => void;
    onReinitialiser: () => void;
};

/** Colonne de gauche : budget, escales, bagages, durée, compagnies. */
export function PanneauFiltres({ filtres, vols, compagnies, onModifier, onBasculerCompagnie, onReinitialiser }: PropsPanneauFiltres) {
    const budgetMax = Math.max(220, filtres.budget);
    const nbDirects = vols.filter(v => !v.escale).length;

    return (
        <div className="rounded-xl border border-trait bg-white p-5">
            <div className="mb-5 flex items-center justify-between">
                <h2 className="text-sm font-medium text-encre">Filtres</h2>
                <button type="button" onClick={onReinitialiser} className="text-[10px] text-principal hover:underline">
                    Réinitialiser
                </button>
            </div>

            <label className="block text-xs text-encre">
                Budget A/R · {filtres.budget} € max
                <input
                    type="range"
                    min={100}
                    max={budgetMax}
                    value={filtres.budget}
                    onChange={e => onModifier("budget", Number(e.target.value))}
                    className="mt-3 block w-full accent-principal"
                />
            </label>
            <div className="mt-1 flex justify-between text-[10px] text-attenue">
                <span>100 €</span>
                <span>{budgetMax} €</span>
            </div>

            <fieldset className="mt-5 space-y-1">
                <legend className="mb-2 text-xs font-medium text-encre">Escales</legend>
                <CaseFiltre libelle={`Vols directs (${nbDirects})`} coche={filtres.directs} onBasculer={() => onModifier("directs", !filtres.directs)} />
                <CaseFiltre libelle={`Avec escale (${vols.length - nbDirects})`} coche={filtres.escales} onBasculer={() => onModifier("escales", !filtres.escales)} />
            </fieldset>

            <fieldset className="mt-5 space-y-1">
                <legend className="mb-2 text-xs font-medium text-encre">Bagages inclus</legend>
                <CaseFiltre libelle="Tous les tarifs" coche={!filtres.cabine} onBasculer={() => onModifier("cabine", !filtres.cabine)} />
                <CaseFiltre libelle="Cabine uniquement" coche={filtres.cabine} onBasculer={() => onModifier("cabine", !filtres.cabine)} />
            </fieldset>

            <label className="mt-5 block text-xs font-medium text-encre">
                Durée maximale à l’aller
                <span className="mt-2 flex items-center gap-2 rounded-lg border border-trait px-3 py-2 text-principal">
                    <Clock aria-hidden="true" className="size-4" />
                    <select
                        value={filtres.dureeMax}
                        onChange={e => onModifier("dureeMax", Number(e.target.value))}
                        className="w-full bg-transparent text-xs text-encre"
                    >
                        {DUREES_MAX.map(h => <option key={h} value={h}>{h} h</option>)}
                    </select>
                </span>
            </label>

            <fieldset className="mt-5 space-y-1">
                <legend className="mb-2 text-xs font-medium text-encre">Compagnies</legend>
                {compagnies.map(nom => (
                    <CaseFiltre
                        key={nom}
                        libelle={nom}
                        coche={!filtres.compagniesExclues.includes(nom)}
                        onBasculer={() => onBasculerCompagnie(nom)}
                    />
                ))}
            </fieldset>
        </div>
    );
}