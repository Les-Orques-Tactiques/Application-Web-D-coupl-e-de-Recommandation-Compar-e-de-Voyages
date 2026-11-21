import { useEffect } from "react";
import {
    ArrowRight,
    ArrowUpRight,
    Check,
    Lightbulb,
    MapPin,
    ShieldCheck,
    SlidersHorizontal,
    Sparkles,
    type LucideIcon,
} from "lucide-react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { classeBouton } from "@/components/ui/Bouton";
import { SurTitre } from "@/components/ui/SurTitre";
import { useAuth } from "@/features/auth/";
import { conteneur } from "@/components/ui/Conteneur"; // NOUVEAU : classe commune pour centrer le contenu et limiter sa largeur

/**
 * Page d'accueil publique (/), affichée avant toute connexion.
 *
 * - L'en-tête et le pied de page viennent de MiseEnPagePublique (le routeur place cette page
 *   dans son <Outlet />) : on ne les redéfinit donc pas ici.
 * - Les liens du menu ("/#approche", "/#inspirations", "/#donnees") pointent vers les
 *   sections de cette page, grâce à leurs attributs "id".
 * - Une personne déjà connectée est envoyée directement vers son espace.
 */
// À supprimer :
// const conteneur = "mx-auto w-full max-w-7xl px-6 lg:px-16";

// Bouton secondaire (contour) : Bouton ne propose que le style plein, on le complète ici
const classeBoutonSecondaire =
    "inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-trait bg-white px-6 text-[15px] font-medium text-principal transition-colors hover:bg-menthe focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-principal";

// ----- Données affichées (séparées du rendu pour être faciles à modifier) -----

interface Atout {
    Icone: LucideIcon;
    titre: string;
    texte: string;
}

const ATOUTS: Atout[] = [
    {
        Icone: Sparkles,
        titre: "Des choix qui vous ressemblent",
        texte: "Vos envies, votre budget, vos dates.",
    },
    {
        Icone: Lightbulb,
        titre: "Des raisons, pas une boîte noire",
        texte: "Chaque vol proposé est expliqué.",
    },
    {
        Icone: SlidersHorizontal,
        titre: "Vous gardez la main",
        texte: "Vos préférences restent modifiables à tout moment.",
    },
];

interface Etape {
    numero: string;
    titre: string;
    texte: string;
}

const ETAPES: Etape[] = [
    {
        numero: "01",
        titre: "Posez vos envies.",
        texte: "Un départ, une destination, quelques dates. Ajoutez vos préférences si vous le souhaitez.",
    },
    {
        numero: "02",
        titre: "Comprenez les choix.",
        texte: "Chaque vol est accompagné de ses raisons : prix, durée, escales et préférences.",
    },
    {
        numero: "03",
        titre: "Choisissez librement.",
        texte: "Gardez vos favoris, comparez, puis réservez sur le site de votre choix.",
    },
];

interface Inspiration {
    ville: string;
    pays: string;
    trajet: string;
    etiquette: string;
    prix: number; // en euros, aller-retour (montant fictif de démonstration)
    image: string; // fichier placé dans public/images
    description: string; // texte alternatif de l'image
}

const INSPIRATIONS: Inspiration[] = [
    {
        ville: "Lisbonne",
        pays: "Portugal",
        trajet: "Paris CDG → LIS · direct · 2 h 35",
        etiquette: "L’équilibre idéal",
        prix: 168,
        image: "/images/pageAccueil/lisbonne.jpg",
        description: "Toits de Lisbonne au bord du Tage",
    },
    {
        ville: "Porto",
        pays: "Portugal",
        trajet: "Paris ORY → OPO · direct · 2 h 10",
        etiquette: "Le plus court",
        prix: 142,
        image: "/images/pageAccueil/porto.jpg",
        description: "Quais de Porto et le Douro",
    },
    {
        ville: "Barcelone",
        pays: "Espagne",
        trajet: "Paris ORY → BCN · direct · 1 h 50",
        etiquette: "Le petit budget",
        prix: 126,
        image: "/images/pageAccueil/barcelone.jpg",
        description: "Vue sur les toits de Barcelone",
    },
];

// Engagements alignés sur les cases de CasesConsentements (inscription)
const ENGAGEMENTS = [
    "Vous explorez les vols sans accepter aucune autorisation facultative.",
    "La personnalisation (favoris, avis, clics de réservation) et la géolocalisation ponctuelle ne s’activent qu’avec votre accord.",
    "Vous retirez ces autorisations quand vous voulez, depuis Mon compte.",
];

// Affiche "168 €" à la française, sans centimes
const formatPrix = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
});

// ----- Page -----

export default function PageAccueil() {
    const { utilisateur, chargement } = useAuth();
    const emplacement = useLocation();

    // React Router change l'adresse sans faire défiler la page jusqu'à l'ancre (#approche…).
    // On le fait donc nous-mêmes. "key" change à chaque navigation : un deuxième clic sur
    // le même lien du menu fait aussi défiler.
    useEffect(() => {
        if (!emplacement.hash) return;
        document.getElementById(emplacement.hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
    }, [emplacement.hash, emplacement.key]);

    // Déjà connecté : même logique que FormulaireConnexion (onboarding d'abord si besoin).
    // Ce retour anticipé est placé APRÈS tous les hooks (règle des hooks de React).
    if (!chargement && utilisateur) {
        return <Navigate to={utilisateur.onboarding_termine ? "/explorer" : "/bienvenue"} replace />;
    }

    return (
        <>
            {/* ----- Héros ----- */}
            <section className={`${conteneur} grid items-center gap-12 py-12 lg:grid-cols-[1fr_1.1fr] lg:py-16`}>
                <div>
                    <span className="inline-block rounded-full bg-menthe px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-principal">
                        Le bon vol, pour vous
                    </span>
                    <h1 className="mt-6 text-[44px] font-normal leading-[1.05] tracking-tight sm:text-[56px]">
                        Moins de recherche.
                        <br />
                        Plus <span className="text-principal">d’horizons.</span>
                    </h1>
                    <p className="mt-5 max-w-md text-[15px] leading-relaxed text-attenue">
                        Des vols recommandés selon vos envies, votre budget et ce qui compte vraiment pour vous.
                        Chaque choix a sa raison.
                    </p>

                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link to="/connexion" className={classeBouton("moyenne")}>
                            Trouver mon prochain vol
                            <ArrowRight aria-hidden="true" className="size-4" />
                        </Link>
                        <Link to="/#approche" className={classeBoutonSecondaire}>
                            Comment ça marche
                        </Link>
                    </div>

                    <p className="mt-5 flex items-center gap-2 text-[12px] text-attenue">
                        <ShieldCheck aria-hidden="true" className="size-4 shrink-0 text-principal" />
                        Compte gratuit · vos préférences restent facultatives
                    </p>
                </div>

                {/* Carte visuelle : bg-menthe s'affiche si l'image ne charge pas */}
                <figure className="relative overflow-hidden rounded-3xl bg-menthe">
                    <img
                        src="/images/pageAccueil/accueil-lisbonne.jpg"
                        alt="Vue sur les toits de Lisbonne et le Tage"
                        className="aspect-[5/4] w-full object-cover"
                    />
                    <figcaption className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4 rounded-2xl bg-white/95 p-4 shadow-lg sm:inset-x-6 sm:bottom-6 sm:p-5">
                        <div>
                            <span className="rounded-full bg-citron px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-encre">
                                Ça vous ressemble
                            </span>
                            <p className="mt-2 text-lg font-semibold tracking-tight text-encre">
                                Un peu plus près de Lisbonne.
                            </p>
                            <p className="text-[12px] text-attenue">Paris CDG → Lisbonne · direct · 2 h 35</p>
                        </div>
                        <p className="shrink-0 text-right">
                            <span className="block text-2xl font-semibold text-encre">{formatPrix.format(168)}</span>
                            <span className="text-[11px] text-attenue">aller-retour</span>
                        </p>
                    </figcaption>
                </figure>
            </section>

            {/* ----- Bande des atouts ----- */}
            <section aria-label="Nos atouts" className="border-y border-trait bg-white">
                <ul className={`${conteneur} grid gap-6 py-6 sm:grid-cols-3`}>
                    {ATOUTS.map(({ Icone, titre, texte }) => (
                        <li key={titre} className="flex items-start gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-menthe text-principal">
                                <Icone aria-hidden="true" className="size-[18px]" />
                            </span>
                            <span className="text-[13px] leading-snug">
                                <span className="block font-semibold text-encre">{titre}</span>
                                <span className="text-attenue">{texte}</span>
                            </span>
                        </li>
                    ))}
                </ul>
            </section>

            {/* ----- Notre approche (lien "Notre approche" de l'en-tête) ----- */}
            <section id="approche" className={`${conteneur} scroll-mt-6 py-16`}>
                <SurTitre>Simple, du départ au retour</SurTitre>
                <h2 className="mt-3 text-[32px] font-normal leading-tight tracking-tight">
                    Votre prochain vol, en trois temps.
                </h2>
                <ol className="mt-10 grid gap-8 md:grid-cols-3">
                    {ETAPES.map((etape) => (
                        <li key={etape.numero} className="border-t border-trait pt-5">
                            <p className="text-[12px] font-bold text-principal">{etape.numero} /</p>
                            <h3 className="mt-2 text-xl font-semibold tracking-tight text-encre">{etape.titre}</h3>
                            <p className="mt-2 text-[14px] leading-relaxed text-attenue">{etape.texte}</p>
                        </li>
                    ))}
                </ol>
            </section>

            {/* ----- Inspirations (lien "Les inspirations" de l'en-tête) ----- */}
            <section id="inspirations" className={`${conteneur} scroll-mt-6 pb-16`}>
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                        <SurTitre>L’envie du moment</SurTitre>
                        <h2 className="mt-3 text-[32px] font-normal leading-tight tracking-tight">
                            Trois envies de prendre l’air.
                        </h2>
                    </div>
                    <p className="text-[12px] text-attenue">Au départ de Paris · exemples de démonstration</p>
                </div>

                <ul className="mt-8 grid gap-6 md:grid-cols-3">
                    {INSPIRATIONS.map((inspiration) => (
                        <li key={inspiration.ville}>
                            <article className="h-full overflow-hidden rounded-2xl border border-trait bg-white">
                                <div className="bg-menthe">
                                    <img
                                        src={inspiration.image}
                                        alt={inspiration.description}
                                        loading="lazy"
                                        className="aspect-[4/3] w-full object-cover"
                                    />
                                </div>
                                <div className="p-5">
                                    <span className="rounded-full bg-menthe px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-principal">
                                        {inspiration.etiquette}
                                    </span>
                                    <div className="mt-3 flex items-baseline justify-between gap-3">
                                        <h3 className="text-xl font-semibold tracking-tight text-encre">{inspiration.ville}</h3>
                                        <p className="text-lg font-semibold text-encre">{formatPrix.format(inspiration.prix)}</p>
                                    </div>
                                    <p className="mt-1 flex items-center gap-1.5 text-[12px] text-attenue">
                                        <MapPin aria-hidden="true" className="size-3.5" />
                                        {inspiration.pays} · aller-retour
                                    </p>
                                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-trait pt-4">
                                        <p className="text-[12px] text-attenue">{inspiration.trajet}</p>
                                        {/* Explorer est réservé aux comptes : on propose l'inscription */}
                                        <Link
                                            to="/inscription"
                                            aria-label={`Créer un compte pour voir les vols vers ${inspiration.ville}`}
                                            className="grid size-8 shrink-0 place-items-center rounded-lg text-principal transition-colors hover:bg-menthe"
                                        >
                                            <ArrowUpRight aria-hidden="true" className="size-4" />
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        </li>
                    ))}
                </ul>

                <p className="mt-4 text-[11px] text-attenue">
                    Offres et montants fictifs de démonstration : aucune réservation n’est faite sur Orca Flight.
                </p>
            </section>

            {/* ----- Vos données (lien "Vos données" de l'en-tête) ----- */}
            <section id="donnees" className="scroll-mt-6 bg-menthe">
                <div className={`${conteneur} grid gap-10 py-14 lg:grid-cols-2 lg:items-center`}>
                    <div>
                        <SurTitre>Vos données ne prennent pas la place</SurTitre>
                        <h2 className="mt-3 text-[32px] font-semibold leading-tight tracking-tight text-encre">
                            La personnalisation est un choix.
                            <br />
                            Pas une obligation.
                        </h2>
                    </div>
                    <div>
                        <ul className="space-y-3">
                            {ENGAGEMENTS.map((engagement) => (
                                <li key={engagement} className="flex items-start gap-3 text-[14px] leading-snug text-encre">
                                    <Check aria-hidden="true" strokeWidth={3} className="mt-0.5 size-4 shrink-0 text-principal" />
                                    {engagement}
                                </li>
                            ))}
                        </ul>
                        <Link to="/confidentialite" className="mt-5 inline-block text-[13px] font-semibold text-principal underline">
                            Lire notre politique de confidentialité
                        </Link>
                    </div>
                </div>
            </section>

            {/* ----- Appel final ----- */}
            <section className={`${conteneur} py-16`}>
                <div className="flex flex-col gap-6 rounded-3xl bg-profond p-8 text-white sm:p-10 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-[28px] font-semibold leading-tight tracking-tight">
                            Votre horizon mérite le bon vol.
                        </h2>
                        <p className="mt-2 text-[15px] text-white/80">
                            Créez votre compte en deux minutes, puis laissez-vous guider.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            to="/inscription"
                            className="inline-flex h-12 items-center gap-2 rounded-xl bg-citron px-6 text-[15px] font-medium text-encre transition hover:brightness-95"
                        >
                            Créer mon compte
                            <ArrowRight aria-hidden="true" className="size-4" />
                        </Link>
                        <Link
                            to="/connexion"
                            className="inline-flex h-12 items-center rounded-xl border border-white/30 px-6 text-[15px] font-medium text-white transition-colors hover:bg-white/10"
                        >
                            Me connecter
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}