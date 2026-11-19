import { ArrowDownToLine, ShieldCheck } from "lucide-react";
import type { useConsentements } from "../hooks/useConsentements";
import { boutonSecondaire, carte, messageStatut, titreCarte } from "../utils/classes";

// Les props sont exactement ce que renvoie le hook, plus l'action d'export
type Props = ReturnType<typeof useConsentements> & { onExporter: () => void };

/** Interrupteur accessible : role="switch" + aria-checked. */
function Interrupteur({ actif, desactive, libelle, onChange }: {
    actif: boolean; desactive: boolean; libelle: string; onChange: () => void;
}) {
    return (
        <button type="button" role="switch" aria-checked={actif} aria-label={libelle}
            disabled={desactive} onClick={onChange}
            className={`relative h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors disabled:cursor-wait disabled:opacity-60 ${actif ? "bg-principal" : "bg-trait"}`}>
            <span className={`block size-4 rounded-full bg-white transition-transform ${actif ? "translate-x-4" : ""}`} />
        </button>
    );
}

export function SectionConfidentialite({
    consentements, chargement, enCours, message, erreur, basculer, retirerFacultatifs, onExporter,
}: Props) {
    const desactive = chargement || enCours;

    const lignes = [
        {
            type: "personnalisation" as const,
            titre: "Personnalisation à partir de mes actions",
            texte: "Favoris, avis et clics enrichissent le profil. Désactivez pour retirer votre accord.",
        },
        {
            type: "localisation" as const,
            titre: "Géolocalisation ponctuelle",
            texte: "Le pays, la ville et l’aéroport peuvent toujours être saisis manuellement.",
        },
    ];

    return (
        <section id="confidentialite" className={carte}>
            <h2 className={titreCarte}>Confidentialité et consentements</h2>

            <ul className="grid gap-4">
                {lignes.map(({ type, titre, texte }) => (
                    <li key={type} className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[13px] font-medium text-encre">{titre}</p>
                            <p className="mt-0.5 text-[12px] text-attenue">{texte}</p>
                        </div>
                        <Interrupteur libelle={titre} actif={consentements[type]} desactive={desactive}
                            onChange={() => void basculer(type)} />
                    </li>
                ))}
            </ul>

            <p className="mt-4 text-[12px] text-attenue">
                Le consentement à la politique de confidentialité, donné à l’inscription, ne peut pas être retiré ici.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
                <button type="button" className={boutonSecondaire} disabled={chargement} onClick={onExporter}>
                    Exporter mes données <ArrowDownToLine className="size-4" aria-hidden="true" />
                </button>
                <button type="button" disabled={desactive} onClick={() => void retirerFacultatifs()}
                    className="text-[12px] font-medium text-principal hover:underline disabled:opacity-60">
                    Retirer tous les consentements facultatifs
                </button>
            </div>

            {message && <p role="status" className={`mt-3 ${messageStatut}`}>{message}</p>}
            {erreur && <p role="alert" className="mt-3 rounded-lg bg-erreur-fond px-4 py-3 text-[13px] text-erreur">{erreur}</p>}

            <div className="mt-4 flex gap-3 rounded-lg bg-menthe p-4">
                <ShieldCheck className="size-5 shrink-0 text-principal" aria-hidden="true" />
                <div>
                    <p className="text-[13px] font-medium text-encre">
                        {consentements.personnalisation
                            ? "Personnalisation activée selon vos choix"
                            : "Consentement de personnalisation retiré"}
                    </p>
                    <p className="mt-0.5 text-[12px] text-attenue">
                        {consentements.personnalisation
                            ? "Vos actions peuvent contribuer à adapter les recommandations."
                            : "Vous gardez les recommandations basées sur vos critères et vos préférences explicites."}
                    </p>
                </div>
            </div>
        </section>
    );
}