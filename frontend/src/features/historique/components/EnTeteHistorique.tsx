type PropsEnTete = {
    chargement: boolean;
    nbRecherches: number;
    confirmerVidage: boolean;
    onVider: () => void;
    onAnnulerVidage: () => void;
};

/** Titre de la page + bouton « Vider l'historique » (avec confirmation en 2 clics). */
export function EnTeteHistorique({ chargement, nbRecherches, confirmerVidage, onVider, onAnnulerVidage }: PropsEnTete) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
                <p className="text-[11px] font-semibold tracking-wider text-principal">VOS RECHERCHES</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-encre">Historique</h1>
                <p className="mt-1 text-[13px] text-attenue">
                    {chargement ? "Chargement…" : `${nbRecherches} recherche(s) affichée(s)`}
                </p>
            </div>
            {nbRecherches > 0 && (
                <button
                    type="button"
                    onClick={onVider}
                    onBlur={onAnnulerVidage} // on annule la confirmation si on clique ailleurs
                    className={`rounded-lg border px-4 py-2 text-[13px] font-medium ${confirmerVidage
                            ? "border-erreur bg-erreur-fond text-erreur"
                            : "border-trait bg-white text-attenue hover:border-principal hover:text-principal"
                        }`}
                >
                    {confirmerVidage ? "Confirmer : tout supprimer" : "Vider l'historique"}
                </button>
            )}
        </div>
    );
}