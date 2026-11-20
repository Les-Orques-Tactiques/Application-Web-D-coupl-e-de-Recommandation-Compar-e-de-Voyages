import { ArrowRight, Heart, Plane, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { dureeLisible } from "../utils/formats";
import { boutonPrincipal, boutonSecondaire } from "../utils/styles";
import type { Avis, Vol } from "../utils/types";

const BOUTONS_AVIS = [
    { valeur: "oui", Icone: ThumbsUp, libelle: "Ce vol me correspond" },
    { valeur: "non", Icone: ThumbsDown, libelle: "Ce vol ne me correspond pas" },
] as const;

type PropsCarteVol = {
    vol: Vol;
    rang: number;
    meilleur: boolean;
    favori: boolean;
    avis?: Avis;
    dates: string;
    allerRetour: boolean;
    onBasculerFavori: () => void;
    onDonnerAvis: (avis: Avis) => void;
    onVoir: () => void;
};

export function CarteVol({ vol, rang, meilleur, favori, avis, dates, allerRetour, onBasculerFavori, onDonnerAvis, onVoir }: PropsCarteVol) {    return (
        <article className={`rounded-xl border bg-white p-5 ${meilleur ? "border-principal/40" : "border-trait"}`}>
            {/* Ligne 1 : rang, compagnie, badge, favori */}
            <div className="flex items-center gap-2 text-[11px]">
                <span className="mr-1 text-attenue">{String(rang).padStart(2, "0")}</span>
                <span className="flex size-7 items-center justify-center rounded-md bg-menthe text-[10px] text-principal">{vol.code}</span>
                <h3 className="text-encre">{vol.compagnie}</h3>
                {meilleur && (
                    <span className="rounded-full bg-citron px-2 py-1 text-[9px] font-semibold text-profond">Meilleur équilibre</span>
                )}
                <button
                    type="button"
                    aria-label={favori ? `Retirer ${vol.compagnie} des favoris` : `Ajouter ${vol.compagnie} aux favoris`}
                    aria-pressed={favori}
                    onClick={onBasculerFavori}
                    className={`ml-auto rounded p-1 text-principal ${favori ? "bg-menthe" : "hover:bg-fond"}`}
                >
                    <Heart aria-hidden="true" className={`size-4 ${favori ? "fill-principal" : ""}`} />
                </button>
            </div>

            {/* Ligne 2 : horaires, trajet, prix */}
            <div className="mt-4 grid grid-cols-[auto_1fr_auto] items-center gap-4 sm:grid-cols-[auto_1fr_auto_115px]">
                <div>
                    <p className="text-2xl font-semibold tracking-tight text-encre">{vol.depart}</p>
                    <p className="mt-1 text-[10px] text-attenue">{vol.lieuDepart}</p>
                </div>
                <div className="text-center">
                    <p className="mb-2 text-[10px] text-attenue">{dureeLisible(vol.duree)}</p>
                    <div className="relative h-px bg-trait">
                        <span className="absolute -top-0.5 left-0 size-1 rounded-full bg-principal" />
                        <Plane aria-hidden="true" className="absolute -top-1.5 right-0 size-3 bg-white pl-0.5 text-principal" />
                    </div>
                    <p className="mt-2 text-[9px] text-principal">{vol.escale ?? "Direct"}</p>
                </div>
                <div>
                    <p className="text-2xl font-semibold tracking-tight text-encre">{vol.arrivee}</p>
                    <p className="mt-1 text-[10px] text-attenue">{vol.lieuArrivee}</p>
                </div>
                <div className="col-span-3 text-right sm:col-span-1">
                    <p className="text-2xl tracking-tight text-encre">{vol.prix} €</p>
                    <p className="text-[9px] text-attenue">{allerRetour ? "aller-retour" : "aller simple"} / pers.</p>                </div>
            </div>

            {/* Explication de la recommandation */}
            <div className="mt-3 flex items-start gap-2 rounded-md bg-menthe/80 px-3 py-2.5 text-[11px] leading-relaxed text-profond">
                <Sparkles aria-hidden="true" className="size-3.5 shrink-0 text-principal" />
                {vol.message}
            </div>

            {/* Avis + bouton détail */}
            <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[10px] text-attenue">
                    <span>Ce vol vous correspond ?</span>
                    {BOUTONS_AVIS.map(({ valeur, Icone, libelle }) => (
                        <button
                            key={valeur}
                            type="button"
                            aria-label={libelle}
                            aria-pressed={avis === valeur}
                            onClick={() => onDonnerAvis(valeur)}
                            className={`rounded p-1 ${avis === valeur ? "bg-menthe text-principal" : "hover:text-principal"}`}
                        >
                            <Icone aria-hidden="true" className="size-3.5" />
                        </button>
                    ))}
                </div>
                <button type="button" onClick={onVoir} className={meilleur ? boutonPrincipal : boutonSecondaire}>
                    Voir le vol <ArrowRight aria-hidden="true" className="size-3.5" />
                </button>
            </div>
        </article>
    );
}