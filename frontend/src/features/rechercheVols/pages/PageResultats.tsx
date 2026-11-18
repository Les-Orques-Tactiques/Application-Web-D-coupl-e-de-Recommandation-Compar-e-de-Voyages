import { useState } from "react";
import { Link } from "react-router-dom";
import { Info, Sparkles } from "lucide-react";
import { SurTitre } from "@/components/ui/SurTitre";
import { BarreTri } from "../components/BarreTri";
import { CarteVol } from "../components/CarteVol";
import { Encart } from "../components/Encart";
import { EtatsAssocies } from "../components/EtatsAssocies";
import { FormulaireModification } from "../components/FormulaireModification";
import { ModaleVol } from "../components/ModaleVol";
import { PanneauFiltres } from "../components/PanneauFiltres";
import { ResumeRecherche } from "../components/ResumeRecherche";
import { useFiltres } from "../hooks/useFiltres";
import { useResultats } from "../hooks/useResultats";
import { boutonSecondaire } from "../utils/styles";
import { formaterDates } from "../utils/formats";
import type { Avis, Vol } from "../utils/types";

/**
 * Page de résultats (/resultats). Affichée dans MiseEnPagePrivee, qui fournit
 * l'en-tête (onglets, avatar, déconnexion) et le pied de page.
 *
 * La page ne fait qu'assembler :
 * - useResultats : saisie, appel au serveur, vols, favoris ;
 * - useFiltres   : filtres et tri appliqués aux vols ;
 * - les composants s'occupent de l'affichage.
 * Elle garde seulement l'état purement visuel (formulaire ouvert, vol sélectionné, avis).
 */
export default function PageResultats() {
    const recherche = useResultats();
    const filtrage = useFiltres(recherche.vols);

    const [edition, setEdition] = useState(false);
    const [selection, setSelection] = useState<Vol | null>(null);
    const [avis, setAvis] = useState<Record<string, Avis>>({});

    const dates = formaterDates(recherche.saisie);
    const nb = filtrage.volsAffiches.length;

    async function rechercher() {
        const reussi = await recherche.lancerRecherche(filtrage.filtres.budget);
        if (reussi) setEdition(false);
    }

    return (
        <section className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-16">
            <ResumeRecherche
                saisie={recherche.saisie}
                budget={filtrage.filtres.budget}
                edition={edition}
                onModifier={recherche.modifierSaisie}
                onBasculerEdition={() => setEdition(!edition)}
            />

            {edition && (
                <FormulaireModification
                    saisie={recherche.saisie}
                    budget={filtrage.filtres.budget}
                    enCours={recherche.enCours}
                    erreur={recherche.erreur}
                    onModifier={recherche.modifierSaisie}
                    onChangerBudget={budget => filtrage.modifierFiltre("budget", budget)}
                    onRechercher={() => void rechercher()}
                    onFermer={() => setEdition(false)}
                />
            )}

            <header className="mb-5 mt-6">
                <SurTitre>Votre sélection, expliquée</SurTitre>
                <h1 aria-live="polite" className="mt-2 text-[32px] font-normal leading-tight tracking-tight text-encre sm:text-[40px]">
                    {nb} vol{nb > 1 ? "s" : ""}. Et de bonnes raisons.
                </h1>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-attenue">
                        {recherche.depuisLaBase
                            ? "Résultats de la base de données · Prix par personne."
                            : "Exemples de démonstration · Prix A/R par personne, taxes incluses."}
                    </p>
                    <Link to="/explorer?onglet=historique" className="text-[10px] font-medium text-principal hover:underline">
                        Voir mon historique <span aria-hidden="true">↗</span>
                    </Link>
                </div>
            </header>

            <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
                <aside className="space-y-4" aria-label="Filtres de recherche">
                    <PanneauFiltres
                        filtres={filtrage.filtres}
                        vols={recherche.vols}
                        compagnies={filtrage.compagnies}
                        onModifier={filtrage.modifierFiltre}
                        onBasculerCompagnie={filtrage.basculerCompagnie}
                        onReinitialiser={filtrage.reinitialiser}
                    />
                    <Encart titre="Pourquoi cet ordre ?" icone={Sparkles}>
                        Vos critères et les choix de profils proches sont combinés. Les raisons restent visibles sur chaque vol.
                    </Encart>
                    <Encart titre="Première connexion ?" icone={Info}>
                        Sans historique, l’approche A s’appuie déjà sur vos critères. Les découvertes collaboratives viendront ensuite.
                    </Encart>
                </aside>

                <div className="min-w-0">
                    <BarreTri tri={filtrage.tri} onChanger={filtrage.setTri} />

                    <div className="space-y-4">
                        {filtrage.volsAffiches.map((vol, index) => (
                            <CarteVol
                                key={vol.id}
                                vol={vol}
                                rang={index + 1}
                                // Le 1er vol du classement par pertinence = meilleur équilibre
                                meilleur={index === 0 && filtrage.tri === "pertinence"}
                                favori={recherche.favoris.includes(vol.id)}
                                avis={avis[vol.id]}
                                dates={dates}
                                depuisLaBase={recherche.depuisLaBase}
                                onBasculerFavori={() => recherche.basculerFavori(vol.id)}
                                onDonnerAvis={valeur => setAvis(precedents => ({ ...precedents, [vol.id]: valeur }))}
                                onVoir={() => setSelection(vol)}
                            />
                        ))}

                        {nb === 0 && (
                            <div role="status" className="rounded-xl border border-trait bg-white p-8 text-center">
                                <h2 className="text-xl text-encre">Aucun vol avec ces critères.</h2>
                                <p className="my-3 text-sm text-attenue">Augmentez votre budget ou assouplissez vos filtres.</p>
                                <button type="button" onClick={filtrage.reinitialiser} className={boutonSecondaire}>
                                    Réinitialiser les filtres
                                </button>
                            </div>
                        )}
                    </div>

                    <p className="mt-5 text-center text-[10px] text-attenue">
                        Vous avez vu {nb} offre{nb > 1 ? "s" : ""}{" "}
                        {recherche.depuisLaBase ? "correspondant à votre recherche en base." : "de cette sélection de démonstration."}
                    </p>
                </div>
            </div>

            <EtatsAssocies avisDonne={Object.keys(avis).length > 0} onReinitialiser={filtrage.reinitialiser} />

            {selection && (
                <ModaleVol
                    vol={selection}
                    dates={dates}
                    depuisLaBase={recherche.depuisLaBase}
                    onFermer={() => setSelection(null)}
                />
            )}
        </section>
    );
}