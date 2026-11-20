type PropsBandeau = {
    nbAffichees: number;
    chargement: boolean;
    onAfficherPlus: () => void;
};

/** Bandeau en bas de liste pour charger les 20 recherches suivantes. */
export function BandeauAfficherPlus({ nbAffichees, chargement, onAfficherPlus }: PropsBandeau) {
    return (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-menthe px-5 py-4 text-[13px] text-encre">
            <span>Vous voyez les {nbAffichees} recherches les plus récentes.</span>
            <button
                type="button"
                onClick={onAfficherPlus}
                disabled={chargement}
                className="rounded-lg border border-trait bg-white px-4 py-2 font-medium text-principal hover:border-principal disabled:opacity-60"
            >
                {chargement ? "Chargement…" : "Afficher plus"}
            </button>
        </div>
    );
}