import { useState } from "react";
import { useAuth } from "@/features/auth";
import {
  BandeauExplorer,
  FormulaireRecherche,
  ListeHistorique,
  ListeVols,
  useExplorer,
  useOnglet,
  type CriteresRecherche,
  type Onglet,
  type RechercheHistorique,
} from "@/features/explorer";

// Valeurs du formulaire à l'ouverture de la page
const CRITERES_PAR_DEFAUT: CriteresRecherche = {
  origine: "LYS",
  destination: "LIS",
  date_depart: "2027-06-12",
  date_retour: "2027-06-19",
  aller_retour: true,
  nb_passagers: 1,
  budget_max: 220,
  devise: "EUR",
  direct_seulement: true,
  bagage_requis: true,
};

// "satisfies" : TypeScript vérifie qu'il y a bien un titre pour CHAQUE onglet
const TITRES = {
  explorer: "Les vols disponibles",
  favoris: "Vos envies prennent leur envol.",
  historique: "Vos dernières recherches.",
  comparateur: "Comparez vos prochains horizons.",
} satisfies Record<Onglet, string>;

/**
 * Espace connecté (/explorer). Affichée dans MiseEnPagePrivee, qui fournit
 * l'en-tête (onglets, avatar, déconnexion) et le pied de page.
 *
 * La page ne fait qu'assembler :
 * - useExplorer s'occupe des données (appels au serveur) ;
 * - useOnglet lit l'onglet actif dans l'adresse (/explorer?onglet=favoris) ;
 * - les composants s'occupent de l'affichage.
 */
export default function PageExplorer() {
  const { utilisateur } = useAuth();
  const { onglet, changerOnglet } = useOnglet();
  const explorer = useExplorer();
  // Les critères sont gardés ici (et pas dans le formulaire) pour que
  // « Reprendre » dans l'historique puisse les modifier.
  const [criteres, setCriteres] = useState(CRITERES_PAR_DEFAUT);

  async function lancerRecherche() {
    await explorer.rechercher(criteres);
    changerOnglet("explorer");
  }

  // Recharge une ancienne recherche dans le formulaire
  function reprendre(recherche: RechercheHistorique) {
    setCriteres({
      ...criteres,
      date_depart: recherche.date_depart ?? criteres.date_depart,
      date_retour: recherche.date_retour ?? criteres.date_retour,
      aller_retour: recherche.aller_retour,
      nb_passagers: recherche.nb_passagers,
    });
    changerOnglet("explorer");
  }

  // Message affiché quand il n'y a aucun vol à montrer
  function messageSiVide(): string {
    if (explorer.chargement) return "Chargement de vos données…";
    if (onglet === "favoris") return "Vous n’avez pas encore de vol favori.";
    if (explorer.rechercheEnCours) return "Recherche des vols dans le catalogue…";
    if (!explorer.aRecherche) return "Lancez une recherche pour consulter les vols enregistrés dans la base.";
    return "Aucun vol ne correspond à ces critères.";
  }

  const vols = onglet === "favoris" ? explorer.favoris : explorer.vols;
  const sousTitre =
    onglet === "historique"
      ? `${explorer.historique.length} recherche(s) enregistrée(s)`
      : `${vols.length} vol(s) du catalogue · prix affichés dans la devise enregistrée`;

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-16">
      <BandeauExplorer prenom={utilisateur?.prenom} />

      <FormulaireRecherche
        criteres={criteres}
        onChange={setCriteres}
        onRechercher={() => void lancerRecherche()}
        enCours={explorer.rechercheEnCours}
      />

      {explorer.erreur && (
        <p role="alert" className="mt-6 rounded-lg bg-erreur-fond px-4 py-3 text-[13px] text-erreur">
          {explorer.erreur}
        </p>
      )}

      <div className="mt-10">
        <h2 className="text-2xl font-semibold tracking-tight text-encre">{TITRES[onglet]}</h2>
        <p className="mt-1 mb-5 text-[13px] text-attenue">{sousTitre}</p>

        {onglet === "historique" ? (
          <ListeHistorique
            historique={explorer.historique}
            chargement={explorer.chargement}
            onReprendre={reprendre}
          />
        ) : (
          <ListeVols
            vols={vols}
            favorisEnCours={explorer.favorisEnCours}
            onBasculerFavori={vol => void explorer.basculerFavori(vol)}
            messageSiVide={messageSiVide()}
          />
        )}
      </div>
    </section>
  );
}