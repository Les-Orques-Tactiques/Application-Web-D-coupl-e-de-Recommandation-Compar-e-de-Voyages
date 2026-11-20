import { useEffect, useState } from "react";
import { ErreurApi } from "@/lib/clientApi";
import type { RechercheHistorique } from "@/features/explorer";
import { lireHistorique, supprimerRecherche, viderHistorique } from "@/features/explorer/services/explorationApi";
import { messageErreur } from "@/features/explorer/utils/formatage";

const TAILLE_PAGE = 20; // nombre de recherches chargées à chaque fois

/**
 * Tout l'état de la page Historique : liste, chargement, erreurs, pagination,
 * suppression et vidage. La page n'a plus qu'à afficher.
 */
export function useHistorique() {
    const [recherches, setRecherches] = useState<RechercheHistorique[]>([]);
    const [chargement, setChargement] = useState(true);
    const [chargementSuite, setChargementSuite] = useState(false);
    const [toutCharge, setToutCharge] = useState(false);
    const [erreur, setErreur] = useState("");
    const [confirmerVidage, setConfirmerVidage] = useState(false);

    // Premier chargement, une seule fois à l'ouverture de la page
    useEffect(() => {
        let actif = true; // évite de modifier l'état si on a quitté la page entre-temps
        lireHistorique(TAILLE_PAGE, 0)
            .then((liste) => {
                if (!actif) return;
                setRecherches(liste);
                setToutCharge(liste.length < TAILLE_PAGE); // moins de 20 : il n'y a rien après
            })
            .catch((e) => {
                if (actif) setErreur(messageErreur(e));
            })
            .finally(() => {
                if (actif) setChargement(false);
            });
        return () => {
            actif = false;
        };
    }, []);

    // « Afficher plus » : on demande les 20 suivantes en sautant celles déjà affichées
    async function afficherPlus() {
        setChargementSuite(true);
        setErreur("");
        try {
            const suite = await lireHistorique(TAILLE_PAGE, recherches.length);
            setRecherches((precedentes) => [...precedentes, ...suite]);
            setToutCharge(suite.length < TAILLE_PAGE);
        } catch (e) {
            setErreur(messageErreur(e));
        } finally {
            setChargementSuite(false);
        }
    }

    // Supprime une recherche côté back, puis la retire de la liste sans tout recharger
    async function supprimer(id: string) {
        setErreur("");
        try {
            await supprimerRecherche(id);
            setRecherches((precedentes) => precedentes.filter((r) => r.id !== id));
        } catch (e) {
            setErreur(messageErreur(e));
        }
    }

    // Premier clic : on demande confirmation. Deuxième clic : on vide.
    async function vider() {
        if (!confirmerVidage) {
            setConfirmerVidage(true);
            return;
        }
        setErreur("");
        try {
            await viderHistorique();
            setRecherches([]);
            setToutCharge(true);
        } catch (e) {
            // Le back limite cette route à 5 appels par minute
            setErreur(
                e instanceof ErreurApi && e.statut === 429
                    ? "Trop de tentatives. Patientez une minute avant de réessayer."
                    : messageErreur(e),
            );
        } finally {
            setConfirmerVidage(false);
        }
    }

    return {
        recherches,
        chargement,
        chargementSuite,
        toutCharge,
        erreur,
        setErreur, // utile à la page pour signaler une recherche impossible à relancer
        confirmerVidage,
        annulerVidage: () => setConfirmerVidage(false),
        afficherPlus,
        supprimer,
        vider,
    };
}