import { useEffect, useMemo, useState } from "react";
import {
  lireRecommandations,
  definirFavori,
  lireFavoris,
  lireHistorique,
  rechercherVols,
  type RechercheHistorique,
  type RechercheVols,
  type Vol,
} from "../services/explorationApi";
import { messageErreur } from "../utils/formatage";

/**
 * Critères tels que le formulaire les manipule (modèle d'UI).
 * La traduction vers le contrat de l'API se fait à un seul endroit : versRequeteApi.
 */
export type CriteresRecherche = {
  origine: string; // code IATA
  destination: string;
  aller_retour: boolean;
  date_depart: string;
  date_retour: string | null;
  nb_passagers: number;
  budget_max: number;
  direct_seulement: boolean;
};

export function versRequeteApi(c: CriteresRecherche): RechercheVols {
  return {
    origine: c.origine,
    destination: c.destination,
    date_depart: c.date_depart,
    aller_retour: c.aller_retour,
    date_retour: c.aller_retour ? c.date_retour : null,
    passagers: c.nb_passagers,
    budget: c.budget_max,
    escales_max: c.direct_seulement ? 0 : null,
  };
}

export function useExplorer() {
  const [vols, setVols] = useState<Vol[]>([]);
  const [favoris, setFavoris] = useState<Vol[]>([]);
  const [historique, setHistorique] = useState<RechercheHistorique[]>([]);
  const [chargement, setChargement] = useState(true);
  
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const [aRecherche, setARecherche] = useState(false);
  const [favorisEnCours, setFavorisEnCours] = useState<Set<string>>(new Set());
  const [erreur, setErreur] = useState<string | null>(null);
  const [recommandations, setRecommandations] = useState<Vol[]>([]);
  const [chargementRecommandations, setChargementRecommandations] = useState(true);
  const [erreurRecommandations, setErreurRecommandations] = useState<string | null>(null);



  // Source de vérité unique : la liste des favoris. Les cartes lisent cet ensemble.
  const favorisIds = useMemo(() => new Set(favoris.map(v => v.id)), [favoris]);

  useEffect(() => {
    // "actif" évite de modifier l'état si la page a été quittée entre-temps
    let actif = true;
    // allSettled : l'échec d'un appel n'empêche pas d'afficher l'autre
    Promise.allSettled([lireFavoris(), lireHistorique()])
      .then(([resFavoris, resHistorique]) => {
        if (!actif) return;
        if (resFavoris.status === "fulfilled") setFavoris(resFavoris.value);
        if (resHistorique.status === "fulfilled") setHistorique(resHistorique.value);
        const echec = [resFavoris, resHistorique].find(r => r.status === "rejected");
        if (echec) setErreur(`Impossible de charger vos données : ${messageErreur(echec.reason)}`);
      })
      .finally(() => {
        if (actif) setChargement(false);
      });
    return () => {
      actif = false;
    };
  }, []);

  // La recherche est déjà enregistrée côté serveur.
  // Un échec du rafraîchissement ne doit pas faire croire que la recherche a échoué.
  async function rafraichirHistorique() {
    try {
      setHistorique(await lireHistorique());
    } catch {
      /* l'historique sera rechargé au prochain affichage */
    }
  }

  useEffect(() => {
    let actif = true;

    lireRecommandations()
      .then((liste) => {
        if (actif) setRecommandations(liste);
      })
      .catch((e: unknown) => {
        if (actif) {
          setErreurRecommandations(
            `Impossible de charger les recommandations : ${messageErreur(e)}`,
          );
        }
      })
      .finally(() => {
        if (actif) setChargementRecommandations(false);
      });

    return () => { actif = false; };
  }, []);


  async function rechercher(criteres: CriteresRecherche) {
    setARecherche(true)
    setRechercheEnCours(true);
    setErreur(null);
    setVols([]);
    try {
      setVols(await rechercherVols(versRequeteApi(criteres)));
      setARecherche(true);
    } catch (e: unknown) {
      setErreur(`La recherche n’a pas abouti : ${messageErreur(e)}`);
      return;
    } finally {
      setRechercheEnCours(false);
    }
    await rafraichirHistorique();
  }

  async function basculerFavori(vol: Vol) {
    if (favorisEnCours.has(vol.id)) return; // évite le double clic
    const nouveauStatut = !favorisIds.has(vol.id);
    setFavorisEnCours(ids => new Set(ids).add(vol.id));
    setErreur(null);
    try {
      await definirFavori(vol.id, nouveauStatut);
      setFavoris(liste =>
        nouveauStatut ? [vol, ...liste.filter(v => v.id !== vol.id)] : liste.filter(v => v.id !== vol.id),
      );
    } catch (e: unknown) {
      setErreur(`Impossible de modifier ce favori : ${messageErreur(e)}`);
    } finally {
      setFavorisEnCours(ids => {
        const suivant = new Set(ids);
        suivant.delete(vol.id);
        return suivant;
      });
    }
  }

  return {
    vols,
    favoris,
    favorisIds,
    historique,
    chargement,
    rechercheEnCours,
    aRecherche,
    favorisEnCours,
    erreur,
    rechercher,
    basculerFavori,
    recommandations,
    chargementRecommandations,
    erreurRecommandations,
  };
}