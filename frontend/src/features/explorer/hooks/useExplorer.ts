import { useEffect, useState } from "react";
import { definirFavori, lireFavoris, lireHistorique, rechercherVols } from "../services/explorationApi";
import { messageErreur } from "../utils/formatage";
import type { RechercheHistorique, VolExplorer } from "../utils/types";

/**
 * Type des critères = type du 1er paramètre de rechercherVols.
 * Pas besoin de le réécrire : si l'API change, ce type suit automatiquement.
 */
export type CriteresRecherche = Parameters<typeof rechercherVols>[0];

/**
 * Toutes les données de l'espace Explorer et les actions possibles.
 * Même rôle que useActivation pour PageActivation : la page n'appelle
 * jamais le serveur elle-même.
 */
export function useExplorer() {
  const [vols, setVols] = useState<VolExplorer[]>([]);
  const [favoris, setFavoris] = useState<VolExplorer[]>([]);
  const [historique, setHistorique] = useState<RechercheHistorique[]>([]);
  const [chargement, setChargement] = useState(true);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const [aRecherche, setARecherche] = useState(false); // au moins une recherche réussie ?
  const [favorisEnCours, setFavorisEnCours] = useState<string[]>([]); // ids en cours de modification
  const [erreur, setErreur] = useState<string | null>(null);

  // Au premier affichage : on charge favoris et historique en parallèle
  useEffect(() => {
    // "actif" évite de modifier l'état si la page a été quittée entre-temps
    let actif = true;
    Promise.all([lireFavoris(), lireHistorique()])
      .then(([volsFavoris, recherches]) => {
        if (!actif) return;
        setFavoris(volsFavoris);
        setHistorique(recherches);
      })
      .catch((e: unknown) => {
        if (actif) setErreur(`Impossible de charger vos données : ${messageErreur(e)}`);
      })
      .finally(() => {
        if (actif) setChargement(false);
      });
    return () => {
      actif = false;
    };
  }, []);

  async function rechercher(criteres: CriteresRecherche) {
    setRechercheEnCours(true);
    setErreur(null);
    setVols([]);
    try {
      // En aller simple, on n'envoie pas de date de retour
      const resultats = await rechercherVols({
        ...criteres,
        date_retour: criteres.aller_retour ? criteres.date_retour : null,
      });
      setVols(resultats);
      setARecherche(true);
      // La recherche vient d'être enregistrée côté serveur : on rafraîchit l'historique
      setHistorique(await lireHistorique());
    } catch (e: unknown) {
      setErreur(`La recherche n’a pas abouti : ${messageErreur(e)}`);
    } finally {
      setRechercheEnCours(false);
    }
  }

  async function basculerFavori(vol: VolExplorer) {
    if (favorisEnCours.includes(vol.id)) return; // évite le double clic
    const nouveauStatut = !vol.favori;
    setFavorisEnCours(ids => [...ids, vol.id]);
    setErreur(null);
    try {
      await definirFavori(vol.id, nouveauStatut);
      const volMisAJour = { ...vol, favori: nouveauStatut };
      setVols(liste => liste.map(v => (v.id === vol.id ? volMisAJour : v)));
      setFavoris(liste =>
        nouveauStatut ? [volMisAJour, ...liste.filter(v => v.id !== vol.id)] : liste.filter(v => v.id !== vol.id),
      );
    } catch (e: unknown) {
      setErreur(`Impossible de modifier ce favori : ${messageErreur(e)}`);
    } finally {
      setFavorisEnCours(ids => ids.filter(id => id !== vol.id));
    }
  }

  return {
    vols,
    favoris,
    historique,
    chargement,
    rechercheEnCours,
    aRecherche,
    favorisEnCours,
    erreur,
    rechercher,
    basculerFavori,
  };
}
