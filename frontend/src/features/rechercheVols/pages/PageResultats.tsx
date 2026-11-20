import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { Info, Sparkles } from "lucide-react";
import { SurTitre } from "@/components/ui/SurTitre";
import { depuisParametres } from "@/features/explorer/utils/parametresRecherche";
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
// 🆕 Avis (US17) et journal des interactions (US22) — adapter le chemin si besoin
import { definirAvis, journaliserInteraction, listerAvis } from "../services/interactionsApi";
import { boutonSecondaire } from "../utils/styles";
import { formaterDates } from "../utils/formats";
import type { Avis, Filtres, Vol } from "../utils/types";
import type { CriteresRecherche } from "@/features/explorer";
import type { EtatDetailVol } from "../utils/detailVol";
/**
 * Page de résultats (/resultats). Affichée dans MiseEnPagePrivee, qui fournit
 * l'en-tête (onglets, avatar, déconnexion) et le pied de page.
 *
 * 🆕 Les critères arrivent par l'URL depuis la page Explorer :
 *   /resultats?origine=LYS&destination=LIS&depart=2027-06-12&...
 *
 * Ce composant lit l'URL puis affiche ContenuResultats.
 * key={...} : si l'URL change (nouvelle recherche depuis Explorer),
 * React recrée entièrement le contenu → les hooks repartent de zéro
 * et la nouvelle recherche est lancée automatiquement.
 */
export default function PageResultats() {
    const [searchParams] = useSearchParams();
    const cle = searchParams.toString();
    // null si l'URL ne contient pas de recherche complète (accès direct à /resultats)
    const criteres = useMemo(() => depuisParametres(new URLSearchParams(cle)), [cle]);

    return <ContenuResultats key={cle} criteres={criteres} />;
}

/** Traduit les critères d'Explorer en filtres de départ pour la page Résultats. */
function versFiltresInitiaux(c: CriteresRecherche | null): Partial<Filtres> | undefined {
    if (!c) return undefined; // pas de critères → filtres par défaut
    return {
        budget: c.budget_max,
        escales: !c.direct_seulement, // « direct seulement » → on masque les vols avec escale
    };
}

/** Convertit l'avis de l'interface (« oui » / « non ») vers le format de l'API (true / false). */
function avisVersBooleen(a: Avis): boolean {
    return a === "oui";
}

type ProprietesContenu = {
    criteres: CriteresRecherche | null;
};

/**
 * La page ne fait qu'assembler :
 * - useResultats : saisie, appel au serveur, vols, favoris ;
 * - useFiltres   : filtres et tri appliqués aux vols ;
 * - les composants s'occupent de l'affichage.
 * Elle garde seulement l'état purement visuel (formulaire ouvert, vol sélectionné, avis).
 */
function ContenuResultats({ criteres }: ProprietesContenu) {
    // 🆕 Les critères de l'URL sont transmis aux deux hooks
    const recherche = useResultats(criteres);
    // useMemo : même objet à chaque rendu (utile pour « Réinitialiser »)
    const filtresInitiaux = useMemo(() => versFiltresInitiaux(criteres), [criteres]);
    const filtrage = useFiltres(recherche.vols, filtresInitiaux);

    const [edition, setEdition] = useState(false);
    const [avis, setAvis] = useState<Record<string, Avis>>({});

    // Recharge les avis déjà donnés : sans ça, les pouces s'éteignent au rechargement
    useEffect(() => {
        if (!recherche.depuisLaBase) return;
        let actif = true;
        listerAvis()
            .then(liste => {
                if (!actif) return;
                const depuisServeur: Record<string, Avis> = {};
                for (const a of liste) depuisServeur[a.vol_id] = a.pertinent ? "oui" : "non";
                // les clics faits pendant le chargement l'emportent
                setAvis(local => ({ ...depuisServeur, ...local }));
            })
            .catch(() => { /* sans avis chargés, les pouces restent éteints */ });
        return () => { actif = false; };
    }, [recherche.depuisLaBase]);

    const dates = formaterDates(recherche.saisie);
    const nb = filtrage.volsAffiches.length;
    const navigate = useNavigate();
    const location = useLocation();

    /** Ouvre la page détail en lui transmettant le vol et le contexte de la recherche. */
    function voirVol(vol: Vol) {
        // 🆕 US22 : journalise la vue (best-effort, on n'attend pas la réponse).
        // Les vols de démonstration n'existent pas en base → seulement les vrais vols.
        if (recherche.depuisLaBase) void journaliserInteraction(vol.id, "vue");

        const etat: EtatDetailVol = {
            vol,
            // La fiche doit afficher la date du vol cliqué, pas celle saisie (tolérance ±14 jours)
            saisie: { ...recherche.saisie, aller: vol.dateDepart ?? recherche.saisie.aller },
            budget: filtrage.filtres.budget,
            favori: recherche.favoris.includes(vol.id),
            depuisLaBase: recherche.depuisLaBase,
            nbResultats: nb,
            retour: location.pathname + location.search,
        };
        navigate(`/vol/${encodeURIComponent(vol.id)}`, { state: etat });
    }

    /** Remplace (ou retire, si undefined) l'avis d'un vol dans l'état local. */
    function changerAvisLocal(volId: string, valeur: Avis | undefined) {
        setAvis(p => {
            const copie = { ...p };
            if (valeur === undefined) delete copie[volId];
            else copie[volId] = valeur;
            return copie;
        });
    }

    /**
     * 🆕 US17 : affiche l'avis tout de suite (mise à jour optimiste),
     * l'envoie au serveur, et remet l'ancien avis si l'appel échoue.
     * Re-cliquer sur l'avis déjà donné le retire (bascule).
     */
    async function donnerAvis(volId: string, valeur: Avis) {
        const precedent = avis[volId];
        const retrait = precedent === valeur; // même bouton cliqué deux fois → on retire l'avis
        changerAvisLocal(volId, retrait ? undefined : valeur);
        if (!recherche.depuisLaBase) return; // démo : avis seulement local

        try {
            await definirAvis(volId, retrait ? null : avisVersBooleen(valeur));
        } catch {
            changerAvisLocal(volId, precedent); // échec → on remet l'ancien avis
        }
    }

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

            {/* 🆕 Erreur visible même quand le formulaire est fermé
         (ex. la recherche automatique venue d'Explorer a échoué) */}
            {!edition && recherche.erreur && (
                <p role="alert" className="mt-6 rounded-lg bg-erreur-fond px-4 py-3 text-[13px] text-erreur">
                    {recherche.erreur}
                </p>
            )}

            <header className="mb-5 mt-6">
                <SurTitre>Votre sélection, expliquée</SurTitre>
                <h1 aria-live="polite" className="mt-2 text-[32px] font-normal leading-tight tracking-tight text-encre sm:text-[40px]">
                    {/* 🆕 Pendant la recherche automatique, on évite d'afficher « 0 vol » */}
                    {recherche.enCours
                        ? "Recherche des vols en cours…"
                        : `${nb} vol${nb > 1 ? "s" : ""}. Et de bonnes raisons.`}
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
                                allerRetour={recherche.saisie.allerRetour}
                                // 🆕 void : basculerFavori peut maintenant être asynchrone (appel API)
                                onBasculerFavori={() => void recherche.basculerFavori(vol.id)}
                                // 🆕 US17 : l'avis est envoyé au serveur
                                onDonnerAvis={valeur => void donnerAvis(vol.id, valeur)}
                                onVoir={() => voirVol(vol)}
                            />
                        ))}

                        {nb === 0 && !recherche.enCours && (
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
        </section>
    );
}