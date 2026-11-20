import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/features/auth";
import { lirePreferences } from "@/features/preferences";
import { versParametres } from "@/features/explorer/utils/parametresRecherche";
import { convertirVolExplorer } from "@/features/rechercheVols/utils/recherche";
import type { EtatPageDetailVol } from "@/features/rechercheVols/pages/PageDetailVol";
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
  type Vol,
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
  direct_seulement: true,
  bagage_requis: true,
};

// "satisfies" : TypeScript vérifie qu'il y a bien un titre pour CHAQUE onglet.
const TITRES = {
  explorer: "Où souhaitez-vous partir ?",
  historique: "Vos dernières recherches.",
  comparateur: "Comparez vos prochains horizons.",
} satisfies Record<Onglet, string>;

export default function PageExplorer() {
  const { utilisateur } = useAuth();
  const { onglet, changerOnglet } = useOnglet();
  // useExplorer sert pour les favoris, l'historique et les recommandations.
  // La recherche, elle, se fait sur la page Résultats.
  const explorer = useExplorer();
  const navigate = useNavigate();

  // Les critères sont gardés ici (et pas dans le formulaire) pour que
  // « Reprendre » dans l'historique puisse les modifier.
  const [criteres, setCriteres] = useState(CRITERES_PAR_DEFAUT);
  // Message affiché si le formulaire est incomplet
  const [erreurSaisie, setErreurSaisie] = useState<string | null>(null);
  // Passe à true dès qu'une action de la personne a touché au formulaire
  const modifieParUtilisateur = useRef(false);

  // Toute modification manuelle du formulaire passe par ici
  function changerCriteres(nouveaux: CriteresRecherche) {
    modifieParUtilisateur.current = true;
    setErreurSaisie(null);
    setCriteres(nouveaux);
  }

  // Préremplit le formulaire avec les préférences enregistrées
  useEffect(() => {
    let actif = true;
    lirePreferences()
      .then((p) => {
        // Si la personne a déjà touché au formulaire, on ne l'écrase pas
        if (!actif || modifieParUtilisateur.current) return;
        setCriteres((c) => ({
          ...c,
          origine: p.aeroport_habituel ?? c.origine,
          budget_max: p.budget_max ?? c.budget_max,
          direct_seulement: p.escales_max === null ? c.direct_seulement : p.escales_max === 0,
        }));
      })
      .catch(() => {
        /* sans préférences, on garde les valeurs par défaut */
      });
    return () => {
      actif = false;
    };
  }, []);

  /**
   * Ouvre la page Résultats avec les critères placés dans l'URL.
   * Exemple : /resultats?origine=LYS&destination=LIS&depart=2027-06-12&...
   * Avantage de l'URL : la page Résultats peut être rechargée ou partagée.
   */
  function lancerRecherche() {
    // Même vérification que depuisParametres() côté Résultats
    if (!criteres.origine || !criteres.destination || !criteres.date_depart) {
      setErreurSaisie("Renseignez l’origine, la destination et la date de départ.");
      return;
    }
    if (criteres.aller_retour && !criteres.date_retour) {
      setErreurSaisie("Renseignez la date de retour pour un aller-retour.");
      return;
    }
    navigate(`/resultats?${versParametres(criteres).toString()}`);
  }

  // Recharge une ancienne recherche dans le formulaire.
  // Action explicite : elle gagne sur le préremplissage, même si celui-ci arrive après.
  function reprendre(recherche: RechercheHistorique) {
    modifieParUtilisateur.current = true;
    setErreurSaisie(null);
    // Forme "fonction" de setCriteres : on part toujours de l'état le plus récent
    setCriteres((c) => ({
      ...c,
      origine: recherche.origine ?? c.origine,
      destination: recherche.destination ?? c.destination,
      date_depart: recherche.date_depart ?? c.date_depart,
      date_retour: recherche.date_retour ?? c.date_retour,
      aller_retour: recherche.aller_retour,
      nb_passagers: recherche.nb_passagers,
      budget_max: recherche.budget_max ?? c.budget_max,
    }));
    changerOnglet("explorer");
  }

  // Sur l'onglet « explorer », on montre les recommandations.
  const afficherRecommandations = onglet === "explorer";

  // Message affiché quand il n'y a aucun vol à montrer
  function messageSiVide(): string {
    if (afficherRecommandations) {
      if (explorer.chargementRecommandations) return "Préparation de vos recommandations…";
      if (explorer.erreurRecommandations) return explorer.erreurRecommandations;
      return "Aucun aller-retour à venir en USD n’est disponible pour votre aéroport habituel dans le catalogue. Vous pouvez lancer une recherche avec un autre départ.";
    }
    return "Lancez une recherche : les vols s’afficheront sur la page Résultats.";
  }

  const vols = afficherRecommandations ? explorer.recommandations : [];

  /**
   * Ouvre la page détail (/vol/:id) avec EXACTEMENT l'état attendu par PageDetailVol.
   * "satisfies" fait vérifier l'objet par TypeScript : une clé oubliée
   * devient une erreur de compilation au lieu d'un plantage dans le navigateur.
   */
  function voirVol(vol: Vol) {
    const etat = {
      vol: convertirVolExplorer(vol),
      // Sur Explorer, il n'y a pas de recherche saisie : on la reconstruit à partir du vol
      saisie: {
        origine: vol.origine,
        destination: vol.destination,
        aller: vol.date_depart ?? "",
        retour: vol.date_retour ?? "",
        allerRetour: vol.aller_retour,
        passagers: 1, // les recommandations sont calculées pour 1 personne
      },
      budget: criteres.budget_max,
      depuisLaBase: true,
      nbResultats: vols.length,
      retour: "/explorer",
      favori: explorer.favorisIds.has(vol.id),
      // Les recommandations sont en USD : la page détail affichera la bonne devise
      devise: vol.devise,
    } satisfies EtatPageDetailVol;

    navigate(`/vol/${vol.id}`, { state: etat });
  }

  const titreResultats = afficherRecommandations ? "Votre sélection de départ" : TITRES[onglet];

  let sousTitre: string;
  if (onglet === "historique") {
    sousTitre = `${explorer.historique.length} recherche(s) enregistrée(s)`;
  } else if (afficherRecommandations) {
    sousTitre = "Selon vos préférences enregistrées, si renseignées · aller-retour · USD · prix du catalogue non revérifiés en direct";
  } else {
    sousTitre = "Remplissez le formulaire puis lancez la recherche.";
  }

  // On affiche d'abord l'erreur de saisie, sinon celle venant de l'API (favoris, historique)
  const erreur = erreurSaisie ?? explorer.erreur;

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-16">
      <BandeauExplorer prenom={utilisateur?.prenom} />

      <FormulaireRecherche
        criteres={criteres}
        onChange={changerCriteres}
        onRechercher={lancerRecherche}
        // La navigation est immédiate : pas d'état « en cours » sur cette page
        enCours={false}
      />

      {erreur && (
        <p role="alert" className="mt-6 rounded-lg bg-erreur-fond px-4 py-3 text-[13px] text-erreur">
          {erreur}
        </p>
      )}

      <div className="mt-10">
        <h2 className="text-2xl font-semibold tracking-tight text-encre">{titreResultats}</h2>
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
            favorisIds={explorer.favorisIds}
            favorisEnCours={explorer.favorisEnCours}
            onBasculerFavori={(vol) => void explorer.basculerFavori(vol)}
            // Chaque carte affiche « Voir le vol », qui ouvre la page détail
            onVoir={voirVol}
            messageSiVide={messageSiVide()}
          />
        )}
      </div>

      {/* 🆕 Repris de complete-front : résumé de ce qui est lié au compte.
          Les compteurs viennent de useExplorer (plus besoin de useState dédiés). */}
      <aside className="mt-10 flex flex-wrap items-center gap-4 rounded-xl bg-menthe p-5">
        <Sparkles className="size-7 shrink-0 text-principal" aria-hidden="true" />
        <div className="min-w-[200px] flex-1">
          <h2 className="text-base font-semibold text-encre">Vos choix donnent le cap.</h2>
          <p className="mt-1 text-[13px] text-attenue">
            {explorer.favoris.length} vol(s) favori(s) et {explorer.historique.length} recherche(s)
            sont associés à votre compte.
          </p>
        </div>
        <Link
          to="/mon-compte"
          className="rounded-lg border border-principal px-4 py-2 text-[13px] font-medium text-principal hover:bg-white"
        >
          Gérer mon profil
        </Link>
      </aside>
    </section>
  );
}