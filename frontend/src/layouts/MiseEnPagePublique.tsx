import { ArrowUpRight } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import { classeBouton } from "@/components/ui/Bouton";
import { Logo } from "@/components/ui/Logo";

// Classes communes pour centrer le contenu et limiter sa largeur (en-tête, page et pied de page)
const conteneur = "mx-auto w-full max-w-7xl px-6 lg:px-16";

/**
 * Cadre commun des pages publiques : en-tête (logo, navigation, boutons), zone centrale et
 * pied de page. Les pages ne le redéfinissent pas : le routeur les place dans <Outlet />.
 *
 * <Link> fonctionne comme un lien <a>, mais change de page sans recharger tout le site.
 */
export function MiseEnPagePublique() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-trait bg-white">
        <div className={`${conteneur} flex h-16 items-center justify-between`}>
          <Link to="/" aria-label="Orca Flight, accueil">
            <Logo />
          </Link>
          {/* "hidden md:flex" : menu masqué sur mobile, affiché à partir de la taille moyenne */}
          <nav aria-label="Navigation principale" className="hidden gap-9 text-[13px] text-attenue md:flex">
            <Link to="/#approche">Notre approche</Link>
            <Link to="/#inspirations">Les inspirations</Link>
            <Link to="/#donnees">Vos données</Link>
          </nav>
          <div className="flex items-center gap-5">
            <Link to="/connexion" className="text-[13px] font-medium text-principal">
              Connexion
            </Link>
            {/* Un lien qui a l'apparence d'un bouton grâce à classeBouton */}
            <Link to="/inscription" className={classeBouton("petite")}>
              Créer un compte
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* flex-1 : la zone centrale prend toute la hauteur disponible, le pied de page reste en bas */}
      <main className="flex-1">
        {/* Outlet = emplacement où s'affiche la page choisie par le routeur */}
        <Outlet />
      </main>

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
