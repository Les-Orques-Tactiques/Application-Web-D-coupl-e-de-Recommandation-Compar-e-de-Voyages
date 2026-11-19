import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    ArrowLeft, Backpack, Briefcase, Check, ExternalLink, Heart,
    Luggage, MousePointerClick, Plane, Sparkles, ThumbsDown, ThumbsUp,
} from "lucide-react";
import { SurTitre } from "@/components/ui/SurTitre";
import { definirFavori } from "@/features/explorer/services/explorationApi";
import { formaterPrix } from "@/features/explorer/utils/formatage";
import {
    decouperLieu, formaterDuree, formaterJour, formaterPeriode,
    raisonsRecommandation, villeCourte, type EtatDetailVol,
} from "../utils/detailVol";
import type { Vol } from "../utils/types";

/**
 * 🆕 État reçu par la page : celui de PageResultats, plus une devise facultative.
 * Explorer envoie la devise (les recommandations sont en USD) ;
 * PageResultats ne l'envoie pas : on affiche alors des euros.
 * On étend le type ici plutôt que de modifier detailVol.ts.
 */
export type EtatPageDetailVol = EtatDetailVol & { devise?: string };

/**
 * Page de détail d'un vol (/vol/:id), affichée dans MiseEnPagePrivee
 * (l'en-tête « Orca Flight » vient donc de la mise en page).
 *
 * Les données arrivent par l'état de navigation (navigate(..., { state })).
 * Si on recharge la page, cet état est perdu : on propose alors de relancer une recherche.
 */
export default function PageDetailVol() {
    const location = useLocation();
    const etat = location.state as EtatPageDetailVol | null;

    // Les hooks doivent être appelés AVANT tout "return" anticipé
    const [favori, setFavori] = useState(etat?.favori ?? false);
    const [favoriEnCours, setFavoriEnCours] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);
    const [avis, setAvis] = useState<"oui" | "non" | null>(null);

    // 🆕 Sans vol OU sans saisie (state incomplet, page rechargée…),
    // on affiche un message au lieu de planter sur saisie.passagers
    if (!etat?.vol || !etat.saisie) {
        return (
            <section className="mx-auto w-full max-w-3xl px-6 py-16 text-center">
                <h1 className="text-2xl text-encre">Ce vol n’est plus affiché.</h1>
                <p className="my-3 text-sm text-attenue">
                    Le détail d’un vol s’ouvre depuis la page de résultats ou depuis Explorer.
                    Relancez une recherche pour le retrouver.
                </p>
                <Link to="/explorer" className="text-sm font-medium text-principal hover:underline">
                    Nouvelle recherche
                </Link>
            </section>
        );
    }

    const { vol, saisie, budget, depuisLaBase, nbResultats, retour } = etat;
    // 🆕 Devise : celle envoyée par Explorer, sinon l'euro (cas de PageResultats)
    const devise = etat.devise ?? "EUR";
    const total = vol.prix * saisie.passagers;

    async function basculerFavori() {
        setFavoriEnCours(true);
        setErreur(null);
        try {
            await definirFavori(vol.id, !favori);
            setFavori(!favori);
        } catch {
            setErreur("Impossible de modifier vos favoris pour le moment.");
        } finally {
            setFavoriEnCours(false);
        }
    }

    return (
        <section className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-16">
            <Link to={retour} className="inline-flex items-center gap-1.5 text-xs font-medium text-principal hover:underline">
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                Revenir aux {nbResultats} résultat{nbResultats > 1 ? "s" : ""}
            </Link>

            {/* ----- En-tête ----- */}
            <header className="mt-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <SurTitre>Le meilleur équilibre pour vous</SurTitre>
                    <h1 className="mt-2 text-[32px] font-normal leading-tight tracking-tight text-encre sm:text-[40px]">
                        {villeCourte(vol.lieuDepart)} → {villeCourte(vol.lieuArrivee)}
                    </h1>
                    <p className="mt-2 text-sm text-attenue">{formaterPeriode(saisie)}</p>
                </div>
                <button
                    type="button"
                    onClick={() => void basculerFavori()}
                    disabled={favoriEnCours}
                    aria-pressed={favori}
                    className="inline-flex items-center gap-2 rounded-lg border border-trait bg-white px-4 py-2.5 text-sm text-encre hover:border-principal disabled:opacity-60"
                >
                    {favori ? "Dans mes favoris" : "Ajouter aux favoris"}
                    <Heart className={`size-4 ${favori ? "fill-principal text-principal" : ""}`} aria-hidden="true" />
                </button>
            </header>

            {erreur && (
                <p role="alert" className="mt-4 rounded-lg bg-erreur-fond px-4 py-3 text-[13px] text-erreur">{erreur}</p>
            )}

            <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                {/* ----- Colonne principale ----- */}
                <div className="space-y-5">
                    <CarteTrajet etiquette="Aller" jour={formaterJour(saisie.aller)} vol={vol} />
                    {saisie.allerRetour && saisie.retour && (
                        // La base ne fournit pas encore les horaires du retour
                        <CarteTrajet etiquette="Retour" jour={formaterJour(saisie.retour)} vol={null} />
                    )}

                    <article className="rounded-xl border border-trait bg-white p-6">
                        <h2 className="text-xl font-semibold text-encre">Vos bagages, sans ambiguïté.</h2>
                        <div className="mt-5 grid gap-5 sm:grid-cols-3">
                            <Bagage icone={Backpack} titre="Petit sac personnel" detail="Généralement inclus · sous le siège" />
                            <Bagage icone={Briefcase} titre="Bagage cabine" detail={vol.cabine ? "Inclus dans ce tarif" : "Non inclus ou non renseigné"} />
                            <Bagage icone={Luggage} titre="Bagage en soute" detail="À vérifier auprès de la compagnie" />
                        </div>
                        <p className="mt-5 text-[11px] text-attenue">
                            Conditions et suppléments à vérifier sur le site de la compagnie.
                        </p>
                    </article>

                    <article className="rounded-xl bg-menthe p-6">
                        <h2 className="flex items-center gap-2 text-xl font-semibold text-encre">
                            <Sparkles className="size-5 text-principal" aria-hidden="true" />
                            Pourquoi on vous le recommande
                        </h2>
                        <ul className="mt-4 space-y-4">
                            {raisonsRecommandation(vol, budget).map((r) => (
                                <li key={r.titre} className="flex gap-3">
                                    <Check className="mt-0.5 size-4 shrink-0 text-principal" aria-hidden="true" />
                                    <div>
                                        <p className="text-sm text-encre">{r.titre}</p>
                                        <p className="text-xs text-attenue">{r.detail}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-encre">
                            <span>Ce vol vous correspond ?</span>
                            <button
                                type="button"
                                aria-pressed={avis === "oui"}
                                onClick={() => setAvis("oui")}
                                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 ${avis === "oui" ? "bg-principal text-white" : "bg-white"}`}
                            >
                                Oui, pertinent <ThumbsUp className="size-3.5" aria-hidden="true" />
                            </button>
                            <button
                                type="button"
                                aria-pressed={avis === "non"}
                                onClick={() => setAvis("non")}
                                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 ${avis === "non" ? "bg-principal text-white" : "text-principal"}`}
                            >
                                Pas vraiment <ThumbsDown className="size-3.5" aria-hidden="true" />
                            </button>
                        </div>
                    </article>
                </div>

                {/* ----- Colonne de droite ----- */}
                <aside className="space-y-4">
                    <div className="rounded-2xl bg-profond p-6 text-white">
                        <span className="rounded-full bg-citron px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-profond">
                            {depuisLaBase ? "Vol de la base de données" : "Offre de démonstration"}
                        </span>
                        {/* 🆕 formaterPrix : affiche la bonne devise (ex. « 122,00 $US ») au lieu d'un « € » en dur */}
                        <p className="mt-4 text-5xl font-medium tracking-tight">{formaterPrix(total, devise)}</p>
                        <p className="mt-1 text-xs text-white/70">
                            Total pour {saisie.passagers} passager{saisie.passagers > 1 ? "s" : ""}
                        </p>

                        <dl className="mt-5 space-y-2 text-xs">
                            <div className="flex justify-between">
                                <dt className="text-white/70">Prix par personne</dt>
                                <dd className="font-semibold">{formaterPrix(vol.prix, devise)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-white/70">Bagage cabine</dt>
                                <dd className="font-semibold">{vol.cabine ? "Inclus" : "Non renseigné"}</dd>
                            </div>
                        </dl>

                        {/* L'API ne fournit pas encore de lien de réservation : bouton désactivé */}
                        <button
                            type="button"
                            disabled
                            className="mt-5 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-citron px-4 py-3 text-sm font-medium text-profond opacity-70"
                        >
                            Réserver chez {vol.compagnie}
                            <ExternalLink className="size-4" aria-hidden="true" />
                        </button>
                        <p className="mt-4 text-[11px] leading-relaxed text-white/70">
                            La réservation et le paiement se font uniquement sur le site de la compagnie.
                            Aucune réservation sur Orca Flight.
                        </p>
                    </div>

                    <div className="flex gap-3 rounded-xl bg-menthe p-4 text-xs">
                        <MousePointerClick className="size-4 shrink-0 text-principal" aria-hidden="true" />
                        <div>
                            <p className="text-encre">Un signal fort pour vos prochains vols</p>
                            <p className="mt-1 text-attenue">
                                Vos favoris et vos avis aident à affiner vos prochaines recommandations.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-trait bg-white p-5 text-xs text-attenue">
                        <h2 className="mb-3 text-sm text-encre">Avant de partir</h2>
                        <p>{vol.message}</p>
                        <p className="mt-3">
                            Vérifiez les conditions exactes du tarif et les documents de voyage auprès de la compagnie.
                            Tous les horaires sont locaux.
                        </p>
                    </div>
                </aside>
            </div>
        </section>
    );
}

/** Carte « Aller » ou « Retour ». vol = null quand les horaires ne sont pas connus. */
function CarteTrajet({ etiquette, jour, vol }: { etiquette: string; jour: string; vol: Vol | null }) {
    return (
        <article className="rounded-xl border border-trait bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-3 text-sm font-semibold text-encre">
                    <span className="rounded-full bg-profond px-2.5 py-1 text-[10px] uppercase tracking-wider text-white">
                        {etiquette}
                    </span>
                    {jour}
                </p>
                {vol && <p className="text-xs text-attenue">{vol.compagnie} · {vol.code}</p>}
            </div>

            {vol ? (
                <TrajetDetaille vol={vol} />
            ) : (
                <p className="mt-5 rounded-lg bg-fond px-4 py-3 text-sm text-attenue">
                    Les horaires du retour ne sont pas encore fournis par la base de données.
                </p>
            )}
        </article>
    );
}

/** Horaires, aéroports et durée d'un trajet. */
function TrajetDetaille({ vol }: { vol: Vol }) {
    const depart = decouperLieu(vol.lieuDepart);
    const arrivee = decouperLieu(vol.lieuArrivee);

    return (
        <>
            <div className="mt-6 grid grid-cols-[1fr_minmax(0,2fr)_1fr] items-center gap-4">
                <div>
                    <p className="text-4xl font-medium tracking-tight text-encre">{vol.depart}</p>
                    <p className="mt-1 text-sm font-semibold text-encre">{depart.code}</p>
                    <p className="text-xs text-attenue">{depart.ville}</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-attenue">{formaterDuree(vol.duree)}</p>
                    <div className="my-2 flex items-center gap-1 text-principal">
                        <span className="size-1.5 rounded-full border border-principal" />
                        <span className="h-px flex-1 bg-trait" />
                        <Plane className="size-4" aria-hidden="true" />
                    </div>
                    <p className="text-xs text-principal">{vol.escale ?? "Sans escale"}</p>
                </div>
                <div className="text-right">
                    <p className="text-4xl font-medium tracking-tight text-encre">{vol.arrivee}</p>
                    <p className="mt-1 text-sm font-semibold text-encre">{arrivee.code}</p>
                    <p className="text-xs text-attenue">{arrivee.ville}</p>
                </div>
            </div>
            <div className="mt-6 flex justify-between border-t border-trait pt-4 text-[11px] text-attenue">
                <span>Opéré par {vol.compagnie}</span>
                <span>Horaires locaux</span>
            </div>
        </>
    );
}

/** Une colonne de la section bagages. */
function Bagage({ icone: Icone, titre, detail }: { icone: typeof Backpack; titre: string; detail: string }) {
    return (
        <div>
            <Icone className="size-5 text-principal" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-encre">{titre}</p>
            <p className="mt-1 text-xs text-attenue">{detail}</p>
        </div>
    );
}