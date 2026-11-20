import { LIBELLES_TRI } from "../utils/constantes";
import type { Tri } from "../utils/types";

const TRIS = Object.keys(LIBELLES_TRI) as Tri[];

export function BarreTri({ tri, onChanger }: { tri: Tri; onChanger: (tri: Tri) => void }) {
    return (
        <>
            <div className="mb-3 text-[11px]">
                <span className="rounded bg-menthe px-2 py-1 font-medium text-profond">Approche A · profil</span>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-attenue">
                <span>Tris rapides :</span>
                {TRIS.map(t => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => onChanger(t)}
                        aria-pressed={t === tri}
                        className={t === tri ? "font-semibold text-principal" : "hover:text-principal"}
                    >
                        {LIBELLES_TRI[t]}
                    </button>
                ))}
            </div>
        </>
    );
}