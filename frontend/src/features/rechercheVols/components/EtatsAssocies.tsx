import { boutonSecondaire } from "../utils/styles";

/** Les deux encadrés du bas : « aucun résultat » et « avis enregistré ». */
export function EtatsAssocies({ avisDonne, onReinitialiser }: { avisDonne: boolean; onReinitialiser: () => void }) {
    return (
        <div className="mt-7 grid overflow-hidden rounded-xl border border-trait md:grid-cols-2">
            <div className="bg-white p-6">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-attenue">État associé · Aucun résultat</p>
                <h2 className="mt-3 text-lg font-semibold text-encre">Un peu plus de souplesse ?</h2>
                <p className="mb-4 mt-2 text-xs leading-6 text-attenue">
                    Aucun vol ne correspond à ces filtres. Élargissez votre budget ou acceptez une escale, sans perdre votre recherche.
                </p>
                <button type="button" onClick={onReinitialiser} className={boutonSecondaire}>Réinitialiser les filtres</button>
            </div>

            <div className="bg-menthe/70 p-6" aria-live="polite">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-principal">État associé · Avis enregistré</p>
                <h2 className="mt-3 text-lg font-semibold text-encre">
                    {avisDonne ? "Merci, votre avis est enregistré." : "Merci, on affine le cap."}
                </h2>
                <p className="mt-2 text-xs leading-6 text-attenue">
                    {avisDonne
                        ? "Votre retour est conservé pendant cette visite. Dans cette démonstration, il ne modifie pas le classement."
                        : "Votre avis « Ce vol me correspond » aidera à préciser vos préférences. Le profil et le classement pourront être actualisés avec votre accord."}
                </p>
                <p className="mt-3 text-[10px] font-semibold text-profond">Démonstration · Données non persistées</p>
            </div>
        </div>
    );
}