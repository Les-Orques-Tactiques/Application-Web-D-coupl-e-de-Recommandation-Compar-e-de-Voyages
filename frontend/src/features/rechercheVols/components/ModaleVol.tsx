import { useEffect } from "react";
import { dureeLisible } from "../utils/formats";
import { boutonSecondaire } from "../utils/styles";
import type { Vol } from "../utils/types";

type PropsModaleVol = { vol: Vol; dates: string; depuisLaBase: boolean; onFermer: () => void };

/** Fenêtre de détail d'un vol. Échap ou clic sur le fond la ferment. */
export function ModaleVol({ vol, dates, depuisLaBase, onFermer }: PropsModaleVol) {
    // Écoute Échap sur tout le document (et pas seulement quand la fenêtre a le focus)
    useEffect(() => {
        function surTouche(e: KeyboardEvent) {
            if (e.key === "Escape") onFermer();
        }
        document.addEventListener("keydown", surTouche);
        return () => document.removeEventListener("keydown", surTouche); // nettoyage à la fermeture
    }, [onFermer]);

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-encre/40 p-6" onClick={onFermer}>
            <section
                role="dialog"
                aria-modal="true"
                aria-label="Détail du vol"
                className="mx-auto my-[10vh] max-w-lg rounded-2xl bg-white p-7 shadow-xl"
                onClick={e => e.stopPropagation()} // un clic DANS la fenêtre ne la ferme pas
            >
                <h2 className="text-2xl text-encre">{vol.compagnie} · {vol.prix} €</h2>
                <p className="mt-4 text-sm text-attenue">{vol.lieuDepart} → {vol.lieuArrivee} · {dates}</p>
                <p className="mt-2 text-sm text-encre">{vol.depart} → {vol.arrivee} · {dureeLisible(vol.duree)}</p>
                <p className="mt-4 rounded-lg bg-menthe p-4 text-xs leading-6 text-encre">
                    {depuisLaBase
                        ? "Vol trouvé dans la base de données. Aucun billet ne peut être réservé ici."
                        : "Offre fictive de démonstration. Aucun billet ne peut être réservé ici."}{" "}
                    Les détails complets du retour ne sont pas fournis.
                </p>
                <button autoFocus type="button" onClick={onFermer} className={`${boutonSecondaire} mt-5`}>
                    Fermer
                </button>
            </section>
        </div>
    );
}