import { ArrowUpRight } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom"; // NOUVEAU : useLocation
import { classeBouton } from "@/components/ui/Bouton";
import { Logo } from "@/components/ui/Logo";
import { BoutonDeconnexion, useAuth } from "@/features/auth"; // NOUVEAU

// Classes communes pour centrer le contenu et limiter sa largeur (en-tête, page et pied de page)
import { conteneur } from "@/components/ui/Conteneur";/**
 * NOUVEAU : partie droite de l'en-tête. Quatre cas possibles :
 * 1. session en cours de vérification → rien (évite un clignotement)
 * 2. personne connectée               → « Bonjour X » + bouton de déconnexion
 * 3. visiteur sur l'accueil           → Connexion + Créer un compte
 * 4. visiteur sur une autre page      → rien (le logo suffit pour revenir à l'accueil)
 */
function ActionsEnTete({ surAccueil }: { surAccueil: boolean }) {
  const { utilisateur, chargement } = useAuth();

  // 1. FournisseurAuth interroge encore /api/auth/moi : sans ce test, « Connexion »
  //    s'afficherait une fraction de seconde avant d'être remplacé.
  if (chargement) return null;

  // 2. Personne connectée : affiché sur toutes les pages
  if (utilisateur) {
    return (
      <div className="flex items-center gap-5">
        {/* "hidden sm:inline" : salutation masquée sur les très petits écrans */}
        <span className="hidden text-[13px] text-attenue sm:inline">
          Bonjour, <span className="font-medium text-principal">{utilisateur.prenom}</span>
        </span>
        <BoutonDeconnexion taille="petite" />
      </div>
    );
  }

  // 3. Visiteur sur la page d'accueil : les deux liens d'origine
  if (surAccueil) {
    return (
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
    );
  }

  // 4. Visiteur sur /connexion, /inscription, etc.
  return null;
}

/**
 * Cadre commun des pages publiques : en-tête (logo, navigation, boutons), zone centrale et
 * pied de page. Les pages ne le redéfinissent pas : le routeur les place dans <Outlet />.
 *
 * <Link> fonctionne comme un lien <a>, mais change de page sans recharger tout le site.
 */
export function MiseEnPagePublique() {
  // NOUVEAU : on regarde sur quelle page on se trouve.
  // Les ancres (/#approche…) ne changent pas le pathname : il reste "/".
  const { pathname } = useLocation();
  const surAccueil = pathname === "/";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-trait bg-white">
        <div className={`${conteneur} flex h-16 items-center justify-between`}>
          <Link to="/" aria-label="Orca Flight, accueil">
            <Logo />
          </Link>

          {/* NOUVEAU : le menu d'ancres n'a de sens que sur la page d'accueil */}
          {surAccueil && (
            /* "hidden md:flex" : menu masqué sur mobile, affiché à partir de la taille moyenne */
            <nav aria-label="Navigation principale" className="hidden gap-9 text-[13px] text-attenue md:flex">
              <Link to="/#approche">Notre approche</Link>
              <Link to="/#inspirations">Les inspirations</Link>
              <Link to="/#donnees">Vos données</Link>
            </nav>
          )}

          {/* NOUVEAU : remplace l'ancien bloc Connexion / Créer un compte */}
          <ActionsEnTete surAccueil={surAccueil} />
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
          <p>Aucune réservation sur Orca Flight</p>
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
