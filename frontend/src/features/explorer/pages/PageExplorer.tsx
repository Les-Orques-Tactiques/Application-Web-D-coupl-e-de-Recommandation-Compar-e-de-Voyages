import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { lirePreferences } from "@/features/preferences";
import { versParametres } from "@/features/explorer/utils/parametresRecherche";
import {
  BandeauExplorer,
  FormulaireRecherche,
  ListeHistorique,
  ListeVols,
  useExplorer,
  useOnglet,
  type CriteresRecherche,
  type Onglet,
} from "@/features/explorer";
import type { RechercheHistorique } from "@/features/explorer/utils/types";
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
};

// "satisfies" : TypeScript vérifie qu'il y a bien un titre pour CHAQUE onglet.
const TITRES = {
    explorer: "Où souhaitez-vous partir ?",
    favoris: "Vos envies prennent leur envol.",
    historique: "Vos dernières recherches.",
    comparateur: "Comparez vos prochains horizons.",
} satisfies Record<Onglet, string>;

export default function PageExplorer() {
    const { utilisateur } = useAuth();
    const { onglet, changerOnglet } = useOnglet();
    // useExplorer sert encore pour les favoris et l'historique.
    // La recherche, elle, se fait désormais sur la page Résultats.
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
        // Même vérification que depuisParametres() côté Résultats :
        // sans origine, destination ou date de départ, la page Résultats ne saurait pas quoi chercher.
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

    // Message affiché quand il n'y a aucun vol à montrer
    function messageSiVide(): string {
 if (explorer.chargement) return "Chargement de vos données…";
        if (onglet === "favoris") return "Vous n’avez pas encore de vol favori.";
        return "Lancez une recherche : les vols s’afficheront sur la page Résultats.";
    }

    // Sur l'onglet « explorer », plus aucun vol n'est chargé ici (liste vide)
    const vols = onglet === "favoris" ? explorer.favoris : [];

    let sousTitre: string;
    if (onglet === "historique") {
        sousTitre = `${explorer.historique.length} recherche(s) enregistrée(s)`;
    } else if (onglet === "favoris") {
        sousTitre = `${vols.length} vol(s) favori(s) · prix affichés dans la devise enregistrée`;
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
          favorisIds={explorer.favorisIds}
   favorisEnCours={explorer.favorisEnCours}
          onBasculerFavori={(vol) => void explorer.basculerFavori(vol)}
   messageSiVide={messageSiVide()}
      />
         )}
     </div>
 </section>
    );
}