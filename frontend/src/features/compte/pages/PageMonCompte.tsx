import { Link, useNavigate } from "react-router-dom";
import { Heart, History, ShieldCheck, SlidersHorizontal, UserRound } from "lucide-react";
import { useAuth } from "@/features/auth";
import { lirePreferences } from "@/features/preferences";
import { versParametres } from "@/features/explorer/utils/parametresRecherche";
import { convertirVolExplorer } from "@/features/rechercheVols/utils/recherche";
import type { EtatPageDetailVol } from "@/features/rechercheVols/pages/PageDetailVol";
import {
    ListeHistorique,
    ListeVols,
    useExplorer,
    type CriteresRecherche,
    type RechercheHistorique,
    type Vol,
} from "@/features/explorer";
import {
    CartePreferences,
    CarteProfil,
    SectionConfidentialite,
    ZoneSuppression,
    useConsentements,
} from "@/features/compte";

// Nombre d'éléments montrés ici ; la liste complète est sur Explorer
const NB_FAVORIS_AFFICHES = 4;
const NB_RECHERCHES_AFFICHEES = 6;

export default function PageMonCompte() {
    const { utilisateur } = useAuth();
    // Mêmes favoris et historique que sur Explorer : un seul hook, aucune requête dupliquée dans le code
    const explorer = useExplorer();
    const confidentialite = useConsentements();
    const navigate = useNavigate();

    // Même état que PageExplorer.voirVol, seul le lien « Revenir » change
    function voirVol(vol: Vol) {
        const etat = {
            vol: convertirVolExplorer(vol),
            saisie: {
                origine: vol.origine,
                destination: vol.destination,
                aller: vol.date_depart ?? "",
                retour: vol.date_retour ?? "",
                allerRetour: vol.aller_retour,
                passagers: 1,
            },
            budget: vol.prix,
            depuisLaBase: true,
            nbResultats: explorer.favoris.length,
            retour: "/mon-compte",
            favori: explorer.favorisIds.has(vol.id),
            devise: vol.devise,
        } satisfies EtatPageDetailVol;

        navigate(`/vol/${vol.id}`, { state: etat });
    }

    // « Reprendre » relance directement la recherche sur la page Résultats
    function reprendre(recherche: RechercheHistorique) {
        // Recherche incomplète : on renvoie vers l'historique d'Explorer
        if (!recherche.origine || !recherche.destination || !recherche.date_depart) {
            navigate("/explorer?onglet=historique");
            return;
        }
        const criteres: CriteresRecherche = {
            origine: recherche.origine,
            destination: recherche.destination,
            date_depart: recherche.date_depart,
            date_retour: recherche.date_retour ?? "",
            aller_retour: recherche.aller_retour,
            nb_passagers: recherche.nb_passagers,
            budget_max: recherche.budget_max ?? 1000, // pas de budget enregistré → budget large
            direct_seulement: false,
            bagage_requis: false,
        };
        navigate(`/resultats?${versParametres(criteres).toString()}`);
    }

    // Télécharge un fichier JSON avec tout ce qui est lié au compte (droit d'accès RGPD)
    async function exporterDonnees() {
        const preferences = await lirePreferences().catch(() => null);
        const contenu = {
            profil: utilisateur,
            preferences,
            consentements: confidentialite.consentements,
            favoris: explorer.favoris,
            historique: explorer.historique,
        };
        const fichier = new Blob([JSON.stringify(contenu, null, 2)], { type: "application/json" });
        const adresse = URL.createObjectURL(fichier);
        const lien = document.createElement("a");
        lien.href = adresse;
        lien.download = "mes-donnees-orca-flight.json";
        lien.click();
        URL.revokeObjectURL(adresse);
    }

    // Raccourcis vers les sections de la page (remplace l'ancienne barre latérale)
    const raccourcis = [
        { ancre: "#profil", libelle: "Profil", Icone: UserRound },
        { ancre: "#preferences", libelle: "Préférences", Icone: SlidersHorizontal },
        { ancre: "#favoris", libelle: `Favoris (${explorer.favoris.length})`, Icone: Heart },
        { ancre: "#historique", libelle: `Historique (${explorer.historique.length})`, Icone: History },
        { ancre: "#confidentialite", libelle: "Confidentialité", Icone: ShieldCheck },
    ];

    return (
        <section className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-16">
            {/* En-tête de page, même hiérarchie que BandeauExplorer */}
            <div>
                <p className="text-[11px] font-semibold tracking-wider text-principal">VOTRE ESPACE, VOS CHOIX</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-encre">Mon compte</h1>
                <p className="mt-1 text-[13px] text-attenue">
                    Un profil qui évolue. Et des données qui restent sous votre contrôle.
                </p>
            </div>

            <nav aria-label="Sections de mon compte" className="mt-6 flex gap-2 overflow-x-auto">
                {raccourcis.map(({ ancre, libelle, Icone }) => (
                    <a key={ancre} href={ancre}
                        className="flex shrink-0 items-center gap-2 rounded-full border border-trait bg-white px-3 py-1.5 text-[12px] text-attenue hover:border-principal hover:text-principal">
                        <Icone className="size-3.5" aria-hidden="true" /> {libelle}
                    </a>
                ))}
            </nav>

            {explorer.erreur && (
                <p role="alert" className="mt-6 rounded-lg bg-erreur-fond px-4 py-3 text-[13px] text-erreur">
                    {explorer.erreur}
                </p>
            )}

            <div className="mt-6 grid gap-5 md:grid-cols-2">
                <CarteProfil />
                <CartePreferences />
            </div>

            <div id="favoris" className="mt-10">
                <div className="mb-5 flex items-end justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight text-encre">Mes favoris</h2>
                        <p className="mt-1 text-[13px] text-attenue">{explorer.favoris.length} vol(s) favori(s)</p>
                    </div>
                    <Link to="/explorer?onglet=favoris" className="text-[13px] font-medium text-principal hover:underline">
                        Tout voir →
                    </Link>
                </div>
                {/* Les mêmes cartes que sur Explorer : cœur et « Voir le vol » fonctionnent pareil */}
                <ListeVols
                    vols={explorer.favoris.slice(0, NB_FAVORIS_AFFICHES)}
                    favorisIds={explorer.favorisIds}
                    favorisEnCours={explorer.favorisEnCours}
                    onBasculerFavori={(vol) => void explorer.basculerFavori(vol)}
                    onVoir={voirVol}
                    messageSiVide={explorer.chargement ? "Chargement de vos favoris…" : "Vous n’avez pas encore de vol favori."}
                />
            </div>

            <div id="historique" className="mt-10">
                <div className="mb-5 flex items-end justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight text-encre">Mon historique</h2>
                        <p className="mt-1 text-[13px] text-attenue">
                            {explorer.historique.length} recherche(s) associée(s) à votre compte
                        </p>
                    </div>
                    <Link to="/explorer?onglet=historique" className="text-[13px] font-medium text-principal hover:underline">
                        Tout voir →
                    </Link>
                </div>
                <ListeHistorique
                    historique={explorer.historique.slice(0, NB_RECHERCHES_AFFICHEES)}
                    chargement={explorer.chargement}
                    onReprendre={reprendre}
                />
            </div>

            <div className="mt-10 grid gap-5">
                <SectionConfidentialite {...confidentialite} onExporter={() => void exporterDonnees()} />
                <ZoneSuppression />
            </div>
        </section>
    );
}