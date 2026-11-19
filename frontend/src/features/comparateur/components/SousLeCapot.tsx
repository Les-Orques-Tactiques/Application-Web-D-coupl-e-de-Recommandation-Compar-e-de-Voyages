// Données de la liste de complexité (une ligne = une approche)
const COMPLEXITES = [
    { approche: "A", cout: "O(N × d) · comparaison exacte des embeddings" },
    { approche: "B", cout: "Pré-calcul O(I² × U) ; requête O(k × |H|)" },
    { approche: "Hybride", cout: "O(N × d + k × |H|) · combinaison des scores" },
];

/** Bas de page : complexité théorique + architecture technique */
export function SousLeCapot() {
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-4 rounded-2xl border border-trait bg-white p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-encre">Complexité · Repères théoriques</h2>
                <dl className="space-y-2.5 text-[13px]">
                    {COMPLEXITES.map(c => (
                        <div key={c.approche} className="grid grid-cols-4 gap-2">
                            <dt className="font-bold text-principal">{c.approche}</dt>
                            <dd className="col-span-3 text-attenue">{c.cout}</dd>
                        </div>
                    ))}
                </dl>
                <p className="border-t border-trait pt-3 text-xs leading-relaxed text-attenue">
                    N : vols candidats · d : dimensions · I : vols du catalogue · U : utilisateurs · H : historique ·
                    k : voisins. Coûts indicatifs, hors index et cache.
                </p>
            </div>

            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-trait bg-menthe p-5 sm:p-6">
                <div className="space-y-3 text-[13px] leading-relaxed">
                    <h2 className="text-lg font-semibold text-encre">Sous le capot, sans détour.</h2>
                    <p className="text-encre">
                        480 vols importés en JSON · 120 profils fictifs pour amorcer B. Même catalogue et mêmes filtres
                        avant classement. Sans historique : repli sur A.
                    </p>
                    <p className="text-attenue">
                        React ↔ API FastAPI ↔ PostgreSQL + pgvector
                        <br />
                        Application découplée · Docker Compose · Git sémantique v0.1.0
                    </p>
                </div>
                <p className="text-xs font-bold text-principal">SAÉ BUT3 5.Real.01 · Maquette interactive de démonstration</p>
            </div>
        </div>
    );
}