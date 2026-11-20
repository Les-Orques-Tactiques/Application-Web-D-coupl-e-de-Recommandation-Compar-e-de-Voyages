import { LIBELLES_TRI } from "../utils/constantes";
import type { Tri } from "../utils/types";

const TRIS = Object.keys(LIBELLES_TRI) as Tri[];

export function BarreTri({ tri, onChanger }: { tri: Tri; onChanger: (tri: Tri) => void }) {
    return (
        <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-[11px]">
                <span className="rounded bg-menthe px-2 py-1 font-medium text-profond">Approche A · profil</span>
                <label className="flex items-center gap-2 text-attenue">
                    Trier par
                    <select
                        value={tri}
                        onChange={e => onChanger(e.target.value as Tri)}
                        className="rounded-lg border border-trait bg-white px-3 py-2 text-principal"
                    >
                        {TRIS.map(t => <option key={t} value={t}>{LIBELLES_TRI[t]}</option>)}
                    </select>
                </label>
            </div>

            <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-[10px] text-attenue">
                <span>Tris rapides :</span>
                {TRIS.map(t => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => onChanger(t)}
                        className={t === tri ? "font-medium text-principal" : "hover:text-principal"}
                    >
                        {LIBELLES_TRI[t]}
                    </button>
                ))}
            </div>
        </>
    );
}