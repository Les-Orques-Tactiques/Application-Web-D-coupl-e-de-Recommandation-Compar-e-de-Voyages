import { Plane, RefreshCw, User } from "lucide-react";
import { Bouton } from "@/components/ui/Bouton";
import type { PROFILS_DEMO } from "../utils/donneesComparateur";

type ProfilDemo = (typeof PROFILS_DEMO)[number];

interface PropsParametresDemo {
    profils: ProfilDemo[];
    profil: ProfilDemo;
    onChoisirProfil: (id: string) => void;
    k: number;
    onChangerK: (k: number) => void;
    rafraichissement: boolean;
    onComparer: () => void;
}

// Style commun aux listes déroulantes (évite de le répéter)
const CLASSE_SELECT =
    "w-full rounded-xl border border-trait bg-white py-2.5 text-sm font-medium text-encre focus:outline-none focus:ring-2 focus:ring-principal";

/** Barre de réglages : compte démo, trajet commun, k, bouton Comparer */
export function ParametresDemo({
    profils, profil, onChoisirProfil, k, onChangerK, rafraichissement, onComparer,
}: PropsParametresDemo) {
    return (
        <section className="rounded-2xl border border-trait bg-white p-5">
            <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-12">
                {/* Compte démo */}
                <div className="space-y-1.5 lg:col-span-4">
                    <label htmlFor="profil-demo" className="block text-xs font-semibold text-attenue">
                        Compte démo pré-rempli
                    </label>
                    <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-attenue" aria-hidden />
                        <select
                            id="profil-demo"
                            value={profil.id}
                            onChange={e => onChoisirProfil(e.target.value)}
                            className={`${CLASSE_SELECT} pl-9 pr-8`}
                        >
                            {profils.map(p => (
                                <option key={p.id} value={p.id}>{p.nom}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Recherche commune (lecture seule) */}
                <div className="space-y-1.5 lg:col-span-5">
                    <span className="block text-xs font-semibold text-attenue">
                        Même recherche pour les 3 approches
                    </span>
                    <div className="flex items-center gap-2.5 rounded-xl border border-trait bg-white px-3.5 py-2.5 text-sm font-medium text-encre">
                        <Plane className="size-4 shrink-0 text-principal" aria-hidden />
                        <span className="truncate">{profil.trajetLabel}</span>
                    </div>
                </div>

                {/* k + bouton */}
                <div className="flex items-end gap-3 lg:col-span-3">
                    <div className="space-y-1.5">
                        <label htmlFor="choix-k" className="block text-xs font-semibold text-attenue">
                            Évaluation
                        </label>
                        <select
                            id="choix-k"
                            value={k}
                            onChange={e => onChangerK(Number(e.target.value))}
                            className={`${CLASSE_SELECT} px-3`}
                        >
                            {[3, 5, 10].map(valeur => (
                                <option key={valeur} value={valeur}>k = {valeur}</option>
                            ))}
                        </select>
                    </div>

                    <Bouton type="button" onClick={onComparer} className="flex-1">
                        Comparer
                        <RefreshCw
                            className={`size-4 transition-transform duration-300 ${rafraichissement ? "rotate-180" : ""}`}
                            aria-hidden
                        />
                    </Bouton>
                </div>
            </div>
        </section>
    );
}