import type { PROFILS_DEMO } from "../utils/donneesComparateur";

type Metrique = (typeof PROFILS_DEMO)[number]["metriques"][number];

interface PropsTableauMetriques {
    metriques: Metrique[];
    k: number;
}

/** « La qualité a plusieurs dimensions » : précision, NDCG, énergie… */
export function TableauMetriques({ metriques, k }: PropsTableauMetriques) {
    return (
        <div className="space-y-5 rounded-2xl border border-trait bg-white p-5 sm:p-6">
            <h2 className="text-2xl font-semibold tracking-tight text-encre">La qualité a plusieurs dimensions.</h2>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-trait text-[11px] uppercase tracking-wider text-attenue">
                            <th className="pb-2.5 text-left font-bold">Exemples démo</th>
                            <th className="pb-2.5 text-right font-bold">A</th>
                            <th className="pb-2.5 text-right font-bold">B</th>
                            <th className="pb-2.5 text-right font-bold">Hybride</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-trait">
                        {metriques.map(m => (
                            <tr key={m.label}>
                                <td className="py-3.5 font-semibold text-encre">
                                    {m.label} <span className="text-attenue">{m.sens}</span>
                                </td>
                                <td className="py-3.5 text-right text-attenue">{m.valeurA}</td>
                                <td className="py-3.5 text-right text-attenue">{m.valeurB}</td>
                                <td className="py-3.5 text-right font-bold text-principal">{m.valeurHybride}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="space-y-2 border-t border-trait pt-3 text-xs leading-relaxed text-attenue">
                <p>Énergie : Wh / 1 000 requêtes, valeurs illustratives sans instrumentation. ↑ Plus élevé préférable · ↓ Plus faible préférable.</p>
                <p>
                    <strong className="text-encre">Précision@{k}</strong> · Part des {k} suggestions jugées pertinentes
                    sur le jeu d’évaluation fictif.
                </p>
                <p>
                    <strong className="text-encre">NDCG@{k}</strong> · Qualité du classement : placer les vols les plus
                    pertinents en premier.
                </p>
            </div>
        </div>
    );
}