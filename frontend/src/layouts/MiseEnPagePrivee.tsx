import { Link, Outlet, useLocation, useSearchParams } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { BoutonDeconnexion, useAuth } from "@/features/auth";

// Classes communes pour centrer le contenu et limiter sa largeur (identiques à la mise en page publique)
const conteneur = "mx-auto w-full max-w-7xl px-6 lg:px-16";

const onglets = [
    { libelle: "Explorer", cle: null },
    { libelle: "Mes favoris", cle: "favoris" },
    { libelle: "Historique", cle: "historique" },
    { libelle: "Comparateur", cle: "comparateur" },
] as const;

/** Navigation principale. Réutilisée deux fois : sur grand écran et sur mobile. */
function NavigationApplication({ className }: { className: string }) {
    const { pathname } = useLocation();
    const [parametres] = useSearchParams();
    const ongletActuel = parametres.get("onglet"); // null si pas de ?onglet=...

    return (
        <nav aria-label="Navigation de l'application" className={className}>
            {onglets.map(({ libelle, cle }) => {
                const actif = pathname === "/explorer" && ongletActuel === cle;
                return (
                    <Link
                        key={libelle}
                        to={cle ? `/explorer?onglet=${cle}` : "/explorer"}
                        // aria-current : indique aux lecteurs d'écran quel onglet est sélectionné
                        aria-current={actif ? "page" : undefined}
                        className={`flex items-center border-b-2 whitespace-nowrap ${actif ? "border-principal text-principal" : "border-transparent text-attenue hover:text-encre"
                            }`}
                    >
                        {libelle}
                    </Link>
                );
            })}
        </nav>
    );
}

/**
 * Cadre commun des pages privées. Le routeur le place sous <RouteProtegee /> :
 * quand ce composant s'affiche, la personne est forcément connectée.
 */
export function MiseEnPagePrivee() {
    const { utilisateur } = useAuth();

    // RouteProtegee garantit la connexion, mais TypeScript ne le sait pas : on prévoit un repli.
    const prenom = utilisateur?.prenom ?? "Mon compte";
    const initiales = utilisateur
        ? `${utilisateur.prenom[0] ?? ""}${utilisateur.nom[0] ?? ""}`.toUpperCase()
        : "?";

    return (
        <div className="flex min-h-screen flex-col">
            <header className="border-b border-trait bg-white">
                <div className={`${conteneur} flex h-16 items-stretch justify-between gap-6`}>
                    {/* Le logo ramène à l'application, pas à la landing page */}
                    <Link to="/explorer" aria-label="Orca Flight, explorer" className="flex items-center">
                        <Logo />
                    </Link>

                    {/* Grand écran : navigation dans l'en-tête */}
                    <NavigationApplication className="hidden gap-9 text-[13px] md:flex" />

                    <div className="flex items-center gap-4">
                        <span
                            aria-hidden="true"
                            className="grid size-8 place-items-center rounded-full bg-profond text-[11px] font-medium text-white"
                        >
                            {initiales}
                        </span>
                        {/* "hidden sm:inline" : prénom masqué sur les très petits écrans */}
                        <span className="hidden text-[13px] font-medium text-encre sm:inline">{prenom}</span>
                        <BoutonDeconnexion taille="petite" />
                    </div>
                </div>

                {/* Mobile : la navigation passe sur une seconde ligne, défilable horizontalement */}
                <div className={`${conteneur} md:hidden`}>
                    <NavigationApplication className="flex h-11 gap-6 overflow-x-auto text-[13px]" />
                </div>
            </header>

            {/* flex-1 : la zone centrale prend toute la hauteur disponible, le pied de page reste en bas */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Pied de page identique à la mise en page publique.
          Idée pour plus tard : l'extraire dans un composant <PiedDePage /> partagé. */}
            <footer className="border-t border-trait bg-white text-[11px] text-attenue">
                <div className={`${conteneur} flex flex-col gap-2 py-5 md:flex-row md:items-center md:justify-between`}>
                    <p>Les Orques tactiques · SAÉ BUT3 5.Real.01 · v0.1.0</p>
                    <p>Offres et montants fictifs de démonstration · Aucune réservation sur Orca Flight</p>
                    <p className="flex gap-3 font-medium text-principal">
                        <Link to="/confidentialite">Confidentialité</Link>
                        <span aria-hidden="true" className="text-attenue">·</span>
                        <Link to="/conditions">Conditions d’utilisation</Link>
                    </p>
                </div>
            </footer>
        </div>
    );
}